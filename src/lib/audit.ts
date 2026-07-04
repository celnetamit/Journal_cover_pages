import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth/session";

// Append a catalog-change entry to the activity log (shown in /admin/logs).
// actorEmail/actorName are snapshotted so the record survives user deletion.
// Best-effort: logging must never break the user's action, so failures are
// swallowed after being reported to the server console.
export async function logAudit(entry: {
  action: string;
  actor: SessionPayload;
  targetType: string;
  targetId?: string | null;
  targetName?: string | null;
  summary?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actor.userId,
        actorEmail: entry.actor.email,
        actorName: entry.actor.name,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        targetName: entry.targetName ?? null,
        summary: entry.summary ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log entry", err);
  }
}
