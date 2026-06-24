"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

export type Page3State = { ok?: boolean; error?: string } | undefined;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const nul = (v: FormDataEntryValue | null) => {
  const t = str(v);
  return t.length ? t : null;
};
// Update the journal's Company (shared across all journals/issues under it) from
// the Page 3 editor.
export async function saveJournalCompany(companyId: string, _prev: Page3State, fd: FormData): Promise<Page3State> {
  await requireRole("EDITOR");
  if (!companyId) return { error: "No company is linked to this journal." };
  if (!str(fd.get("name"))) return { error: "Company name is required." };
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        name: str(fd.get("name")),
        registeredAddress: nul(fd.get("registeredAddress")),
        salesAddress: nul(fd.get("salesAddress")),
        phone: nul(fd.get("phone")),
        email: nul(fd.get("email")),
        cin: nul(fd.get("cin")),
        gst: nul(fd.get("gst")),
        bankAccountName: nul(fd.get("bankAccountName")),
        bankAccountNo: nul(fd.get("bankAccountNo")),
        bankIfsc: nul(fd.get("bankIfsc")),
        bankName: nul(fd.get("bankName")),
        bankBranch: nul(fd.get("bankBranch")),
        bankSwift: nul(fd.get("bankSwift")),
      },
    });
  } catch (e) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return { error: "A company with that name already exists." };
    }
    throw e;
  }
  revalidatePath("/");
  return { ok: true };
}

// Promote the current Focus & Scope (about + focus list) from Page 4 to the
// shared Journal record (the default for all issues + the dynamic data).
export async function saveJournalFocus(journalId: string, _prev: Page3State, fd: FormData): Promise<Page3State> {
  await requireRole("EDITOR");
  const focusScope = str(fd.get("focusScope"))
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  await prisma.journal.update({ where: { id: journalId }, data: { focusScope } });
  revalidatePath("/");
  return { ok: true };
}
