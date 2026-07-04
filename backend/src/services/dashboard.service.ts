import { certificateRepository } from "../repositories/certificate.repository";
import { verificationLogRepository } from "../repositories/verification-log.repository";
import { VerificationStatus } from "../models/Certificate";
import { env } from "../config/env";
import path from "path";

export class DashboardService {
  async getStatistics(): Promise<{
    totalCertificates: number;
    onChain: number;
    pending: number;
    failed: number;
    totalVerifications: number;
    verifiedCount: number;
    tamperedCount: number;
    network: { chainId: number; contractAddress: string };
    recentCertificates: Array<{
      certificateId: string;
      studentName: string;
      course: string;
      department: string;
      verificationStatus: string;
      createdAt: Date;
      qrCodeUrl: string;
    }>;
  }> {
    const [statusCounts, totalCertificates, verificationCounts, recent] = await Promise.all([
      certificateRepository.countByStatus(),
      certificateRepository.totalCount(),
      verificationLogRepository.countByResult(),
      certificateRepository.findRecent(5),
    ]);

    return {
      totalCertificates,
      onChain: statusCounts[VerificationStatus.ON_CHAIN] ?? 0,
      pending: statusCounts[VerificationStatus.PENDING] ?? 0,
      failed: statusCounts[VerificationStatus.FAILED] ?? 0,
      totalVerifications: verificationCounts.total,
      verifiedCount: verificationCounts.verified,
      tamperedCount: verificationCounts.tampered,
      network: {
        chainId: env.CHAIN_ID,
        contractAddress: env.CONTRACT_ADDRESS,
      },
      recentCertificates: recent.map((c) => ({
        certificateId: c.certificateId,
        studentName: c.studentName,
        course: c.course,
        department: c.department,
        verificationStatus: c.verificationStatus,
        createdAt: c.createdAt,
        qrCodeUrl: `/uploads/qrcodes/${c.certificateId}.png`,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
