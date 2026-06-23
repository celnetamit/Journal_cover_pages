import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type SubscriptionTier = {
  id: string;
  issuesPerYear: number;
  printInr: number | null;
  singleIssueInr: number | null;
  onlineInr: number | null;
  printOnlineInr: number | null;
  printUsd: number | null;
  onlineUsd: number | null;
  printOnlineUsd: number | null;
};

// All frequency-based subscription pricing tiers, keyed by issues-per-year.
// The Subscription page picks the tier matching the journal's issuesPerYear.
export const getSubscriptionTiers = cache(async (): Promise<SubscriptionTier[]> => {
  try {
    const rows = await prisma.subscriptionTier.findMany({ orderBy: { issuesPerYear: "asc" } });
    return rows.map((r) => ({
      id: r.id,
      issuesPerYear: r.issuesPerYear,
      printInr: r.printInr,
      singleIssueInr: r.singleIssueInr,
      onlineInr: r.onlineInr,
      printOnlineInr: r.printOnlineInr,
      printUsd: r.printUsd,
      onlineUsd: r.onlineUsd,
      printOnlineUsd: r.printOnlineUsd,
    }));
  } catch {
    return [];
  }
});
