"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Database, FilePlus2, LayoutTemplate, Printer } from "lucide-react";
import { GUIDE_STEPS } from "@/lib/guide-steps";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  overview: BookOpen,
  setup: Database,
  journal: FilePlus2,
  build: LayoutTemplate,
  print: Printer,
};

// Sidebar navigation for the Guide. Highlights the active step based on the URL.
export default function GuideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">User guide</p>
      {GUIDE_STEPS.map((step) => {
        const active = pathname === step.href;
        const Icon = ICONS[step.slug] ?? BookOpen;
        return (
          <Link
            key={step.slug}
            href={step.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition ${
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className={`mt-0.5 ${active ? "text-white" : "text-slate-400"}`}>
              <Icon size={16} />
            </span>
            <span className="flex flex-col">
              <span className="font-medium">
                {step.num > 0 ? `${step.num}. ` : ""}
                {step.title}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
