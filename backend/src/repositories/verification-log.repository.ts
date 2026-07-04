import { VerificationLog, VerificationResult } from "../models/VerificationLog";

export class VerificationLogRepository {
  async create(data: {
    certificateId: string;
    verifiedByIp?: string | null;
    result: VerificationResult;
  }): Promise<VerificationLog> {
    return VerificationLog.create(data);
  }

  async countByResult(): Promise<{ verified: number; tampered: number; total: number }> {
    const rows = await VerificationLog.findAll({
      attributes: ["result", [VerificationLog.sequelize!.fn("COUNT", "*"), "count"]],
      group: ["result"],
      raw: true,
    }) as unknown as { result: string; count: string }[];

    let verified = 0;
    let tampered = 0;

    for (const row of rows) {
      const count = parseInt(row.count, 10);
      if (row.result === VerificationResult.VERIFIED) verified = count;
      if (row.result === VerificationResult.TAMPERED) tampered = count;
    }

    return { verified, tampered, total: verified + tampered };
  }

  async findByCertificateInternalId(certificateInternalId: string): Promise<VerificationLog[]> {
    return VerificationLog.findAll({
      where: { certificateId: certificateInternalId },
      order: [["verifiedTime", "DESC"]],
    });
  }
}

export const verificationLogRepository = new VerificationLogRepository();
