import { AuditLog, AuditAction } from "../models/AuditLog";

export interface CreateAuditLogInput {
  userId?: string | null;
  action: AuditAction;
  resourceType?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class AuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    return AuditLog.create({
      userId: input.userId ?? null,
      action: input.action,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? null,
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
