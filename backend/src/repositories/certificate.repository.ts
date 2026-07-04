import { Certificate, VerificationStatus } from "../models/Certificate";

export interface CertificateCreateData {
  certificateId: string;
  studentName: string;
  studentEmail?: string | null;
  course: string;
  department: string;
  issueDate: string;
  pdfPath: string;
  sha256Hash: string;
  verificationStatus?: VerificationStatus;
}

export interface CertificateUpdateData {
  blockchainTx?: string | null;
  contractAddress?: string | null;
  walletAddress?: string | null;
  verificationStatus?: VerificationStatus;
}

export class CertificateRepository {
  async create(data: CertificateCreateData): Promise<Certificate> {
    return Certificate.create({
      ...data,
      verificationStatus: data.verificationStatus ?? VerificationStatus.PENDING,
    });
  }

  async findByCertificateId(certificateId: string): Promise<Certificate | null> {
    return Certificate.findOne({ where: { certificateId } });
  }

  async findBySha256Hash(sha256Hash: string): Promise<Certificate | null> {
    return Certificate.findOne({ where: { sha256Hash } });
  }

  async findById(id: string): Promise<Certificate | null> {
    return Certificate.findByPk(id);
  }

  async findAllPaginated(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return Certificate.findAndCountAll({
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findRecent(limit: number): Promise<Certificate[]> {
    return Certificate.findAll({
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async update(id: string, data: CertificateUpdateData): Promise<Certificate> {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw new Error("Certificate not found");
    return cert.update(data);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await Certificate.destroy({ where: { id } });
    return deleted > 0;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await Certificate.findAll({
      attributes: ["verificationStatus", [Certificate.sequelize!.fn("COUNT", "*"), "count"]],
      group: ["verificationStatus"],
      raw: true,
    }) as unknown as { verificationStatus: string; count: string }[];

    const result: Record<string, number> = {
      PENDING: 0,
      ON_CHAIN: 0,
      FAILED: 0,
    };

    for (const row of rows) {
      result[row.verificationStatus] = parseInt(row.count, 10);
    }
    return result;
  }

  async totalCount(): Promise<number> {
    return Certificate.count();
  }
}

export const certificateRepository = new CertificateRepository();
