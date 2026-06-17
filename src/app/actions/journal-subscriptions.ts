"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

const num = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s && Number.isFinite(Number(s)) ? Number(s) : null;
};

// Set per-journal price overrides for each global subscription plan. For every
// plan, if a USD or INR price is provided the override is upserted; otherwise
// any existing override for that plan is removed (the journal falls back to the
// global price).
export async function setJournalSubscriptions(journalId: string, formData: FormData): Promise<void> {
  await requireRole("EDITOR");

  const plans = await prisma.subscription.findMany({ select: { id: true } });
  for (const plan of plans) {
    const priceUsd = num(formData.get(`usd_${plan.id}`));
    const priceInr = num(formData.get(`inr_${plan.id}`));
    const where = { journalId_subscriptionId: { journalId, subscriptionId: plan.id } };

    if (priceUsd == null && priceInr == null) {
      await prisma.journalSubscription.deleteMany({ where: { journalId, subscriptionId: plan.id } });
    } else {
      await prisma.journalSubscription.upsert({
        where,
        update: { priceUsd, priceInr },
        create: { journalId, subscriptionId: plan.id, priceUsd, priceInr },
      });
    }
  }

  revalidatePath(`/journals/${journalId}/edit`);
  revalidatePath("/");
}
