import { db } from "./index";
import { auditLog } from "./schema";

type AuditPayload = {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: number | null;
  payload?: Record<string, unknown>;
};

export async function logAudit({
  action,
  entityType,
  entityId,
  userId,
  payload,
}: AuditPayload) {
  await db.insert(auditLog).values({
    action,
    entityType,
    entityId: entityId ?? null,
    userId: userId ?? null,
    payload: payload ?? null,
  });
}
