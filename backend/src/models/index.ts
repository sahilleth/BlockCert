import { Certificate } from "./Certificate";
import { User } from "./User";
import { VerificationLog } from "./VerificationLog";
import { AuditLog } from "./AuditLog";

/**
 * Relationships
 * ─────────────────────────────────────────────────────────────────────────────
 * Certificate 1 ──► N VerificationLog
 *   Each certificate can be verified many times (employers, re-scans, audits).
 *   verification_logs.certificate_id → certificates.id (internal PK).
 *
 * User has no direct FK to certificates in this schema.
 *   ADMIN users issue certificates via the API; audit is via blockchain_tx +
 *   wallet_address on the certificate row itself.
 */

Certificate.hasMany(VerificationLog, {
  foreignKey: "certificateId",
  as: "verificationLogs",
  onDelete: "CASCADE",
});

VerificationLog.belongsTo(Certificate, {
  foreignKey: "certificateId",
  as: "certificate",
});

User.hasMany(AuditLog, {
  foreignKey: "userId",
  as: "auditLogs",
  onDelete: "SET NULL",
});

AuditLog.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

export { User, Certificate, VerificationLog, AuditLog };
export { UserRole } from "./User";
export { VerificationStatus } from "./Certificate";
export { VerificationResult } from "./VerificationLog";
export { AuditAction } from "./AuditLog";
