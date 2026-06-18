import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { dynamicKey } from "@/lib/lookup";
import type { Journal } from "@/lib/journals";

export type EditorialMember = {
  role: string;
  name: string;
  designation: string;
  department: string;
  affiliation: string;
  location: string;
  email: string;
  photo: string;
  priority: number;
};

export type ManagementPersonData = {
  name: string;
  role: string;
  department: string;
  photo: string;
};

export type ManagementTeam = {
  head: ManagementPersonData | null;
  members: ManagementPersonData[];
};

export type DynamicJournalDetails = {
  name: string;
  abbreviation: string;
  about: string;
  eIssn: string;
  pIssn: string;
  publisher: string;
  imprint: string;
  address: string;
  publisherEmail: string;
  publisherPhone: string;
  website: string;
};

export type DynamicFocusScope = {
  abbreviation: string;
  about: string;
  focusScope: string[];
  keywords: string[];
  binderText: string;
};

export type DynamicBinderData = {
  detailsByKey: Record<string, DynamicJournalDetails>;
  focusByKey: Record<string, DynamicFocusScope>;
  editorialByKey: Record<string, EditorialMember[]>;
  managementByKey: Record<string, ManagementTeam>;
  status: {
    enabled: boolean;
    fetchedAt?: string;
    errors: string[];
  };
};

export function emptyDynamicBinderData(errors: string[] = []): DynamicBinderData {
  return {
    detailsByKey: {},
    focusByKey: {},
    editorialByKey: {},
    managementByKey: {},
    status: { enabled: true, errors },
  };
}

const JOURNAL_ROLE_LABELS: Record<string, string> = {
  EDITOR_IN_CHIEF: "Editor-in-Chief",
  ASSOCIATE_EDITOR_IN_CHIEF: "Associate Editor-in-Chief",
  EDITORIAL_BOARD: "Editorial Board Member",
  MANAGING_EDITOR: "Managing Editor",
  ADVISOR: "Advisor",
  REVIEWER: "Reviewer",
  MANAGEMENT_HEAD: "Head",
  MANAGEMENT_MEMBER: "Member",
};

// Roles that appear on the editorial board page (management roles are excluded).
const EDITORIAL_ROLES = new Set([
  "EDITOR_IN_CHIEF",
  "ASSOCIATE_EDITOR_IN_CHIEF",
  "EDITORIAL_BOARD",
  "MANAGING_EDITOR",
  "ADVISOR",
  "REVIEWER",
]);

const s = (v: string | null | undefined) => v ?? "";

function addAliases<T>(target: Record<string, T>, value: T, aliases: Array<string | undefined>) {
  for (const alias of aliases) {
    const key = dynamicKey(alias);
    if (key && !target[key]) target[key] = value;
  }
}

export const getDynamicBinderData = cache(async (_journal?: Journal): Promise<DynamicBinderData> => {
  void _journal;
  try {
    const journals = await prisma.journal.findMany({
      include: {
        publisher: { include: { company: true } },
        members: { include: { profile: true }, orderBy: { order: "asc" } },
      },
    });

    const data = emptyDynamicBinderData();

    for (const j of journals) {
      const aliases = [j.abbreviation, j.shortName ?? undefined, j.name, j.id, j.slug, j.legacyId ?? undefined];
      const company = j.publisher?.company ?? null;

      addAliases(data.detailsByKey, {
        name: j.name,
        abbreviation: j.abbreviation,
        about: s(j.about),
        eIssn: s(j.issnOnline),
        pIssn: s(j.issnPrint),
        publisher: s(j.publisher?.name),
        imprint: s(company?.name),
        address: s(company?.registeredAddress),
        publisherEmail: s(company?.email),
        publisherPhone: s(company?.phone),
        website: s(j.website),
      }, aliases);

      addAliases(data.focusByKey, {
        abbreviation: j.abbreviation,
        about: s(j.about),
        focusScope: j.focusScope,
        keywords: j.keywords,
        binderText: s(j.about),
      }, aliases);

      const editorial: EditorialMember[] = j.members
        .filter((m) => EDITORIAL_ROLES.has(m.role))
        .map((m) => ({
          role: JOURNAL_ROLE_LABELS[m.role] ?? m.role,
          name: m.profile.name,
          designation: s(m.profile.designation),
          department: s(m.profile.department),
          affiliation: s(m.profile.affiliation),
          location: s(m.profile.address),
          email: s(m.profile.email),
          photo: s(m.profile.photoUrl),
          priority: m.order,
        }));
      if (editorial.length) addAliases(data.editorialByKey, editorial, aliases);

      const toManagementPerson = (m: (typeof j.members)[number]): ManagementPersonData => ({
        name: m.profile.name,
        role: s(m.profile.designation) || JOURNAL_ROLE_LABELS[m.role] || "",
        department: s(m.profile.department),
        photo: s(m.profile.photoUrl),
      });
      const headMember = j.members.find((m) => m.role === "MANAGEMENT_HEAD");
      const memberRows = j.members.filter((m) => m.role === "MANAGEMENT_MEMBER");
      if (headMember || memberRows.length) {
        addAliases(
          data.managementByKey,
          { head: headMember ? toManagementPerson(headMember) : null, members: memberRows.map(toManagementPerson) },
          aliases,
        );
      }
    }

    data.status.fetchedAt = new Date().toISOString();
    return data;
  } catch (error) {
    return emptyDynamicBinderData([
      error instanceof Error ? error.message : "Failed to load journal data from the database.",
    ]);
  }
});

// Backwards-compatible alias retained for any callers expecting a search variant.
export async function getDynamicBinderDataForSearch(_search = ""): Promise<DynamicBinderData> {
  void _search;
  return getDynamicBinderData();
}
