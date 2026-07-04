import { auditLogRepository } from "../repositories/audit-log.repository";
import { AuditAction } from "../models/AuditLog";
import { logger } from "../utils/logger";

export interface AuditContext {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

class AuditService {
  /** Fire-and-forget — audit failures must not block API responses */
  log(
    action: AuditAction,
    context: AuditContext,
    options?: {
      resourceType?: string;
      resourceId?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    auditLogRepository
      .create({
        userId: context.userId ?? null,
        action,
        resourceType: options?.resourceType ?? null,
        resourceId: options?.resourceId ?? null,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent?.slice(0, 512) ?? null,
        metadata: options?.metadata ?? null,
      })
      .catch((error) => {
        logger.error("Failed to write audit log", {
          action,
          error: (error as Error).message,
        });
      });
  }

  loginSuccess(context: AuditContext, userId: string, email: string): void {
    this.log(AuditAction.LOGIN_SUCCESS, { ...context, userId }, {
      resourceType: "user",
      resourceId: userId,
      metadata: { email },
    });
  }

  loginFailed(context: AuditContext, email: string): void {
    this.log(AuditAction.LOGIN_FAILED, context, {
      resourceType: "user",
      metadata: { email },
    });
  }

  certificateUpload(
    context: AuditContext,
    certificateId: string,
    metadata: Record<string, unknown>
  ): void {
    this.log(AuditAction.CERTIFICATE_UPLOAD, context, {
      resourceType: "certificate",
      resourceId: certificateId,
      metadata,
    });
  }

  certificateDelete(context: AuditContext, certificateId: string): void {
    this.log(AuditAction.CERTIFICATE_DELETE, context, {
      resourceType: "certificate",
      resourceId: certificateId,
    });
  }
}

export const auditService = new AuditService();

/** Extract audit context from Express request */
export function auditContextFromRequest(req: {
  ip?: string;
  headers: { "user-agent"?: string };
  user?: { userId: string };
}): AuditContext {
  return {
    userId: req.user?.userId ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}
