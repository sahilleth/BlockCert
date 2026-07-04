import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { certificateRepository } from "../repositories/certificate.repository";
import { verificationLogRepository } from "../repositories/verification-log.repository";
import { VerificationStatus } from "../models/Certificate";
import { VerificationResult } from "../models/VerificationLog";
import {
  ConflictError,
  NotFoundError,
  BlockchainError,
  ValidationError,
} from "../errors/AppError";
import { computeSha256 } from "../utils/hash.util";
import { generateVerificationQR } from "../utils/qr.util";
import { getBlockchainService } from "./blockchain.service";
import { getStorageProvider } from "./storage.service";
import { auditService, AuditContext } from "./audit.service";
import { env } from "../config/env";
import { qrDir } from "../middlewares/upload.middleware";
import { logger } from "../utils/logger";
import { Certificate } from "../models/Certificate";

export interface UploadCertificateInput {
  studentName: string;
  studentEmail?: string;
  course: string;
  department: string;
  issueDate: string;
  file: Express.Multer.File;
}

function formatCertificateResponse(cert: Certificate, verificationUrl?: string) {
  const base = cert.toJSON();
  const certId = cert.certificateId;
  return {
    ...base,
    verificationUrl: verificationUrl ?? `${env.FRONTEND_URL}/verify/${certId}`,
    qrCodeUrl: `/uploads/qrcodes/${certId}.png`,
    pdfUrl: `/uploads/certificates/${path.basename(cert.pdfPath)}`,
  };
}

export interface VerificationResponse {
  certificateId: string;
  studentName: string;
  studentEmail: string | null;
  course: string;
  department: string;
  issueDate: string;
  status: VerificationResult;
  message: string;
  onChain: boolean;
  hashAudit: {
    recalculatedHash: string | null;
    storedHash: string;
    blockchainHash: string | null;
    hashMatchesChain: boolean;
    hashMatchesStored: boolean;
    pdfAvailable: boolean;
  };
  blockchainTx: string | null;
  contractAddress: string | null;
  walletAddress: string | null;
  verifiedAt: string;
  verificationHistory: Array<{
    id: string;
    result: VerificationResult;
    verifiedByIp: string | null;
    verifiedTime: Date;
  }>;
}

export class CertificateService {
  /**
   * Full issuance pipeline:
   * 1. Save PDF locally
   * 2. Compute SHA-256 hash
   * 3. Persist metadata in MySQL
   * 4. Register hash on Polygon via smart contract
   * 5. Store transaction hash
   * 6. Generate QR code
   */
  async upload(input: UploadCertificateInput, auditContext?: AuditContext) {
    if (!input.file) {
      throw new ValidationError("PDF certificate file is required");
    }

    const certificateId = uuidv4();
    const sha256Hash = computeSha256(input.file.path);

    logger.info("SHA-256 computed for certificate", { certificateId, sha256Hash });

    // Duplicate detection — application layer (DB unique index is the backstop)
    const existingHash = await certificateRepository.findBySha256Hash(sha256Hash);
    if (existingHash) {
      fs.unlinkSync(input.file.path);
      throw new ConflictError("This certificate PDF has already been issued");
    }

    // On-chain duplicate check before persisting
    try {
      const blockchain = getBlockchainService();
      const registered = await blockchain.isHashRegistered(sha256Hash);
      if (registered) {
        fs.unlinkSync(input.file.path);
        throw new ConflictError("This certificate hash is already registered on-chain");
      }
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      logger.warn("On-chain duplicate check skipped", { error: (error as Error).message });
    }

    const storage = getStorageProvider();
    const stored = await storage.store(input.file.path, input.file.filename);

    const certificate = await certificateRepository.create({
      certificateId,
      studentName: input.studentName,
      studentEmail: input.studentEmail || null,
      course: input.course,
      department: input.department,
      issueDate: input.issueDate,
      pdfPath: stored.filePath,
      sha256Hash,
      verificationStatus: VerificationStatus.PENDING,
    });

    logger.info("Certificate saved to database", { id: certificate.id, certificateId });

    try {
      const blockchain = getBlockchainService();
      const onChain = await blockchain.issueOnChain(certificateId, sha256Hash);

      logger.info("Hash registered on blockchain", {
        certificateId,
        txHash: onChain.txHash,
      });

      const { verificationUrl } = await generateVerificationQR(certificateId);

      const updated = await certificateRepository.update(certificate.id, {
        blockchainTx: onChain.txHash,
        contractAddress: onChain.contractAddress,
        walletAddress: onChain.walletAddress,
        verificationStatus: VerificationStatus.ON_CHAIN,
      });

      if (auditContext) {
        auditService.certificateUpload(auditContext, certificateId, {
          studentName: input.studentName,
          course: input.course,
          department: input.department,
          txHash: onChain.txHash,
        });
      }

      return formatCertificateResponse(updated, verificationUrl);
    } catch (error) {
      await certificateRepository.update(certificate.id, {
        verificationStatus: VerificationStatus.FAILED,
      });
      logger.error("Blockchain registration failed", {
        certificateId,
        error: (error as Error).message,
      });
      throw new BlockchainError(
        `Failed to register hash on blockchain: ${(error as Error).message}`
      );
    }
  }

  async list(page = 1, limit = 20) {
    const { rows, count } = await certificateRepository.findAllPaginated(page, limit);
    return {
      items: rows.map((c) => formatCertificateResponse(c)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async getById(certificateId: string) {
    const cert = await certificateRepository.findByCertificateId(certificateId);
    if (!cert) throw new NotFoundError("Certificate not found");
    return formatCertificateResponse(cert);
  }

  async verify(certificateId: string, ipAddress?: string): Promise<VerificationResponse> {
    const cert = await certificateRepository.findByCertificateId(certificateId);
    if (!cert) throw new NotFoundError("Certificate not found");

    const storedHash = cert.sha256Hash.toLowerCase();

    // Step 1: Recalculate SHA-256 from stored PDF bytes
    let recalculatedHash = "";
    let pdfReadable = false;
    if (cert.pdfPath && fs.existsSync(cert.pdfPath)) {
      try {
        recalculatedHash = computeSha256(cert.pdfPath).toLowerCase();
        pdfReadable = true;
      } catch (error) {
        logger.error("Failed to recalculate PDF hash", {
          certificateId,
          error: (error as Error).message,
        });
      }
    }

    // Step 2: Fetch hash registered on blockchain
    let blockchainHash = "";
    let onChainExists = false;

    try {
      const blockchain = getBlockchainService();
      const onChain = await blockchain.getOnChainCertificate(certificateId);
      onChainExists = onChain.exists;
      blockchainHash = onChain.hash.replace(/^0x/i, "").toLowerCase();
    } catch (error) {
      logger.warn("On-chain lookup failed during verification", {
        certificateId,
        error: (error as Error).message,
      });
    }

    // Step 3: Compare recalculated hash with blockchain hash (primary trust anchor)
    const hashMatchesChain =
      pdfReadable && onChainExists && recalculatedHash === blockchainHash;
    const hashMatchesStored = pdfReadable && recalculatedHash === storedHash;

    const result =
      hashMatchesChain && hashMatchesStored
        ? VerificationResult.VERIFIED
        : VerificationResult.TAMPERED;

    const verifiedAt = new Date();

    // Step 4: Log every verification attempt
    await verificationLogRepository.create({
      certificateId: cert.id,
      verifiedByIp: ipAddress ?? null,
      result,
    });

    logger.info("Employer verification completed", {
      certificateId,
      result,
      ipAddress,
      hashMatchesChain,
      hashMatchesStored,
      onChainExists,
    });

    // Step 5: Fetch verification history (includes the log just created)
    const historyLogs = await verificationLogRepository.findByCertificateInternalId(cert.id);

    return {
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      studentEmail: cert.studentEmail,
      course: cert.course,
      department: cert.department,
      issueDate: cert.issueDate,
      status: result,
      message:
        result === VerificationResult.VERIFIED
          ? "Authentic Certificate"
          : "Certificate Tampered",
      onChain: onChainExists,
      hashAudit: {
        recalculatedHash: recalculatedHash || null,
        storedHash,
        blockchainHash: blockchainHash || null,
        hashMatchesChain,
        hashMatchesStored,
        pdfAvailable: pdfReadable,
      },
      blockchainTx: cert.blockchainTx,
      contractAddress: cert.contractAddress,
      walletAddress: cert.walletAddress,
      verifiedAt: verifiedAt.toISOString(),
      verificationHistory: historyLogs.map((log) => ({
        id: log.id,
        result: log.result,
        verifiedByIp: log.verifiedByIp,
        verifiedTime: log.verifiedTime,
      })),
    };
  }

  async getVerificationHistory(certificateId: string): Promise<
    Array<{
      id: string;
      result: VerificationResult;
      verifiedByIp: string | null;
      verifiedTime: Date;
    }>
  > {
    const cert = await certificateRepository.findByCertificateId(certificateId);
    if (!cert) throw new NotFoundError("Certificate not found");

    const logs = await verificationLogRepository.findByCertificateInternalId(cert.id);
    return logs.map((log) => ({
      id: log.id,
      result: log.result,
      verifiedByIp: log.verifiedByIp,
      verifiedTime: log.verifiedTime,
    }));
  }

  async delete(certificateId: string, auditContext?: AuditContext) {
    const cert = await certificateRepository.findByCertificateId(certificateId);
    if (!cert) throw new NotFoundError("Certificate not found");

    if (cert.pdfPath && fs.existsSync(cert.pdfPath)) {
      fs.unlinkSync(cert.pdfPath);
    }
    const qrPath = path.join(qrDir, `${cert.certificateId}.png`);
    if (fs.existsSync(qrPath)) {
      fs.unlinkSync(qrPath);
    }

    await certificateRepository.delete(cert.id);

    logger.info("Certificate deleted", { certificateId });

    if (auditContext) {
      auditService.certificateDelete(auditContext, certificateId);
    }

    return { deleted: true, certificateId };
  }
}

export const certificateService = new CertificateService();
