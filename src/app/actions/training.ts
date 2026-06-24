"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

export type TrainingState = { ok?: boolean; error?: string; journalId?: string } | undefined;

// Recognisable, clearly-labelled names so practice data is easy to spot/remove.
const TAG = "🎓 Training";
const COMPANY = `${TAG} Company`;
const PUBLISHER = `${TAG} Publisher`;
const DOMAIN = `${TAG} Domain`;
const PROFILE = `${TAG} Editor`;
const JOURNAL = `${TAG} Journal`;
const SLUG = "training-journal";

// Create a safe, self-contained practice dataset (idempotent). Returns the
// training journal id so the tour can jump straight to it.
export async function seedTrainingData(): Promise<TrainingState> {
  await requireRole("EDITOR");
  try {
    const company = await prisma.company.upsert({
      where: { name: COMPANY },
      update: {},
      create: {
        name: COMPANY,
        registeredAddress: "123 Practice Road, Demo City",
        printedBy: "Laxman Printo Graphics, Noida",
      },
    });

    const publisher = await prisma.publisher.upsert({
      where: { name: PUBLISHER },
      update: { companyId: company.id },
      create: {
        name: PUBLISHER,
        about: "This is a practice publisher used for training. Replace it with your own About text.",
        company: { connect: { id: company.id } },
      },
    });

    const domain = await prisma.domain.upsert({
      where: { name: DOMAIN },
      update: {},
      create: { name: DOMAIN },
    });

    let manager = await prisma.profile.findFirst({ where: { name: PROFILE } });
    if (!manager) {
      manager = await prisma.profile.create({
        data: { name: PROFILE, email: "training.editor@example.com", designation: "Managing Editor" },
      });
    }

    const journal = await prisma.journal.upsert({
      where: { slug: SLUG },
      update: {},
      create: {
        slug: SLUG,
        name: JOURNAL,
        abbreviation: "TRAIN",
        issuesPerYear: 3,
        frequency: "TRIANNUAL",
        frequencyLabel: "Triannual",
        domain: { connect: { id: domain.id } },
        publisher: { connect: { id: publisher.id } },
        manager: { connect: { id: manager.id } },
      },
    });

    revalidatePath("/");
    revalidatePath("/journals");
    revalidatePath("/admin");
    return { ok: true, journalId: journal.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create practice data." };
  }
}

// Remove the practice dataset created above.
export async function resetTrainingData(): Promise<TrainingState> {
  await requireRole("EDITOR");
  try {
    await prisma.journal.deleteMany({ where: { slug: SLUG } });
    await prisma.publisher.deleteMany({ where: { name: PUBLISHER } });
    await prisma.company.deleteMany({ where: { name: COMPANY } });
    await prisma.domain.deleteMany({ where: { name: DOMAIN } });
    await prisma.profile.deleteMany({ where: { name: PROFILE } });
    revalidatePath("/");
    revalidatePath("/journals");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not remove practice data." };
  }
}
