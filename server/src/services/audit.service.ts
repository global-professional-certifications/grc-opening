import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const AUDIT_ACTIONS = {
  USER_DISABLED:               'USER_DISABLED',
  USER_ENABLED:                'USER_ENABLED',
  USER_STATUS_CHANGED:         'USER_STATUS_CHANGED',
  JOB_APPROVED:                'JOB_APPROVED',
  JOB_REJECTED:                'JOB_REJECTED',
  JOB_CLOSED:                  'JOB_CLOSED',
  COMPANY_VERIFIED:            'COMPANY_VERIFIED',
  COMPANY_VERIFICATION_REVOKED:'COMPANY_VERIFICATION_REVOKED',
  BROADCAST_SENT:              'BROADCAST_SENT',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

export interface LogAuditParams {
  adminId:    string;
  action:     AuditAction;
  targetType?: string;
  targetId?:   string;
  metadata?:   Record<string, unknown>;
}

export const logAdminAction = async (params: LogAuditParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId:    params.adminId,
        action:     params.action,
        targetType: params.targetType ?? null,
        targetId:   params.targetId   ?? null,
        metadata:   (params.metadata  ?? null) as any,
      },
    });
  } catch (err) {
    console.error('[AuditService] Failed to write audit log:', err);
  }
};
