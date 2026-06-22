// Ordered steps for the in-app user Guide. Shared by the guide sidebar nav and
// the overview page so the order/titles stay in one place.
export type GuideStep = {
  slug: string;
  href: string;
  num: number;
  title: string;
  summary: string;
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    slug: "overview",
    href: "/guide",
    num: 0,
    title: "Overview",
    summary: "What the platform does and the big picture, with a 3-minute video tour.",
  },
  {
    slug: "setup",
    href: "/guide/setup",
    num: 1,
    title: "Set up shared data",
    summary: "Publishers, companies, profiles, domains and subscriptions that every journal reuses.",
  },
  {
    slug: "journal",
    href: "/guide/journal",
    num: 2,
    title: "Create a journal",
    summary: "Add a journal, its metadata, covers, board and subscription overrides.",
  },
  {
    slug: "build",
    href: "/guide/build",
    num: 3,
    title: "Build an issue",
    summary: "Pick an issue and fill the nine sections, from cover spread to contents.",
  },
  {
    slug: "print",
    href: "/guide/print",
    num: 4,
    title: "Preview & print the binder",
    summary: "Preview every page, then export print-ready cover and internal-page PDFs.",
  },
];
