"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, canEditBinders, isAdmin } from "@/lib/auth/session";
import { canManageJournal } from "@/lib/journal-access";
import { qaGateState } from "@/lib/binder-qa";
import { logAudit } from "@/lib/audit";

export type QaActionState = { ok?: boolean; error?: string } | undefined;

async function loadBinder(binderId: string) {
  return prisma.binder.findUnique({
    where: { id: binderId },
    select: {
      id: true,
      journalId: true,
      reviewStatus: true,
      volume: true,
      issue: true,
      year: true,
      journal: { select: { name: true } },
    },
  });
}

// Forward a binder to the internal review team. Hard gate: the latest QA run
// against the current assembled PDF must have zero fails. An ADMIN may
// override with a reason, which is recorded in the activity log.
export async function submitForInternalReview(
  binderId: string,
  overrideReason?: string,
): Promise<QaActionState> {
  const session = await requireSession();
  if (!canEditBinders(session.role)) return { error: "You do not have permission to submit binders." };

  const binder = await loadBinder(binderId);
  if (!binder) return { error: "Binder not found." };
  if (!(await canManageJournal(session, binder.journalId))) return { error: "You do not manage this journal." };
  if (binder.reviewStatus === "IN_INTERNAL_REVIEW") return { error: "This binder is already with the internal review team." };

  const gate = await qaGateState(binderId);
  const wantsOverride = Boolean(overrideReason?.trim());

  if (!gate.passed) {
    if (!wantsOverride) return { error: gate.reason };
    if (!isAdmin(session.role)) {
      return { error: `${gate.reason} Only an admin can override the QA gate.` };
    }
  }

  await prisma.binder.update({
    where: { id: binderId },
    data: { reviewStatus: "IN_INTERNAL_REVIEW", submittedAt: new Date(), submittedById: session.userId },
  });

  const issue = `Vol ${binder.volume ?? "?"} Issue ${binder.issue ?? "?"} ${binder.year ?? ""}`.trim();
  if (!gate.passed && wantsOverride) {
    await logAudit({
      action: "binder.qa_override",
      actor: session,
      targetType: "Binder",
      targetId: binderId,
      targetName: binder.journal.name,
      summary: `ADMIN OVERRIDE — submitted ${issue} to internal review despite QA gate (${gate.reason}). Reason: ${overrideReason!.trim()}`,
    });
  }
  await logAudit({
    action: "binder.submitted",
    actor: session,
    targetType: "Binder",
    targetId: binderId,
    targetName: binder.journal.name,
    summary: `Submitted ${issue} to the internal review team${gate.passed ? " (QA passed)" : " (admin override)"}.`,
  });

  revalidatePath("/qa");
  revalidatePath(`/qa/${binder.journalId}`);
  revalidatePath("/qa/review");
  return { ok: true };
}

// Pull a binder back from the internal review queue (e.g. after corrections
// are requested). Logged; the QA gate applies again on the next submission.
export async function returnToDraft(binderId: string): Promise<QaActionState> {
  const session = await requireSession();
  if (!canEditBinders(session.role)) return { error: "You do not have permission to update binders." };

  const binder = await loadBinder(binderId);
  if (!binder) return { error: "Binder not found." };
  if (!(await canManageJournal(session, binder.journalId))) return { error: "You do not manage this journal." };
  if (binder.reviewStatus !== "IN_INTERNAL_REVIEW") return { error: "This binder is not in internal review." };

  await prisma.binder.update({
    where: { id: binderId },
    data: { reviewStatus: "DRAFT", submittedAt: null, submittedById: null },
  });
  await logAudit({
    action: "binder.returned_to_draft",
    actor: session,
    targetType: "Binder",
    targetId: binderId,
    targetName: binder.journal.name,
    summary: `Returned Vol ${binder.volume ?? "?"} Issue ${binder.issue ?? "?"} ${binder.year ?? ""} to draft for corrections.`,
  });

  revalidatePath("/qa");
  revalidatePath(`/qa/${binder.journalId}`);
  revalidatePath("/qa/review");
  return { ok: true };
}
