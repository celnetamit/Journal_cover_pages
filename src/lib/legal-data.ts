import "server-only";
import { prisma } from "@/lib/prisma";

export type LegalPlan = { id: string; name: string; mode: string; priceUsd: number | null; priceInr: number | null; hidden: boolean };

// Per-journal data for the subscription / payment / legal page (Page 3).
export type LegalInfo = {
  companyId: string;
  publisherName: string;
  publisherEmail: string;
  publisherPhone: string;
  publisherWebsite: string;
  companyName: string;
  registeredAddress: string;
  salesAddress: string;
  phone: string;
  email: string;
  website: string;
  cin: string;
  gst: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankName: string;
  bankBranch: string;
  bankSwift: string;
  openAccessIndia: string;
  openAccessSaarc: string;
  openAccessOther: string;
  plans: LegalPlan[];
};

const s = (v: string | null | undefined) => v ?? "";

export async function getJournalLegalData(): Promise<Record<string, LegalInfo>> {
  const [journals, globalPlans] = await Promise.all([
    prisma.journal.findMany({
      include: { publisher: { include: { company: true } }, subscriptions: true },
    }),
    prisma.subscription.findMany({ orderBy: { name: "asc" } }),
  ]);

  const map: Record<string, LegalInfo> = {};
  for (const j of journals) {
    const c = j.publisher?.company ?? null;
    const overrides = new Map(j.subscriptions.map((o) => [o.subscriptionId, o]));
    const hidden = new Set(j.hiddenSubscriptionIds);
    const plans: LegalPlan[] = globalPlans.map((p) => {
      const o = overrides.get(p.id);
      return {
        id: p.id,
        name: p.name,
        mode: p.mode,
        priceUsd: o?.priceUsd ?? p.priceUsd,
        priceInr: o?.priceInr ?? p.priceInr,
        hidden: hidden.has(p.id),
      };
    });
    map[j.id] = {
      companyId: s(c?.id),
      publisherName: s(j.publisher?.name),
      publisherEmail: s(j.publisher?.email),
      publisherPhone: s(j.publisher?.phone),
      publisherWebsite: s(j.publisher?.website),
      companyName: s(c?.name),
      registeredAddress: s(c?.registeredAddress),
      salesAddress: s(c?.salesAddress),
      phone: s(c?.phone),
      email: s(c?.email),
      website: s(c?.website),
      cin: s(c?.cin),
      gst: s(c?.gst),
      bankAccountName: s(c?.bankAccountName),
      bankAccountNo: s(c?.bankAccountNo),
      bankIfsc: s(c?.bankIfsc),
      bankName: s(c?.bankName),
      bankBranch: s(c?.bankBranch),
      bankSwift: s(c?.bankSwift),
      openAccessIndia: s(c?.openAccessIndia),
      openAccessSaarc: s(c?.openAccessSaarc),
      openAccessOther: s(c?.openAccessOther),
      plans,
    };
  }
  return map;
}
