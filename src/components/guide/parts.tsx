import Link from "next/link";
import { GUIDE_STEPS } from "@/lib/guide-steps";

// Presentational building blocks for the Guide pages. Plain server components.

export function PageHeader({ num, title, lead }: { num?: number; title: string; lead: string }) {
  return (
    <header className="mb-8 border-b border-slate-200 pb-6">
      {num ? (
        <span className="mb-2 inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Step {num}
        </span>
      ) : null}
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{lead}</p>
    </header>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-3 text-lg font-semibold text-slate-900">{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-relaxed text-slate-700">{children}</p>;
}

// A clickable label that mimics an on-screen button/field name.
export function UI({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[0.85em] font-medium text-slate-700">
      {children}
    </span>
  );
}

export function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full rounded-xl border border-slate-200 shadow-sm"
      />
      {caption ? <figcaption className="mt-2 text-center text-sm text-slate-500">{caption}</figcaption> : null}
    </figure>
  );
}

const CALLOUT_STYLES = {
  tip: "border-emerald-200 bg-emerald-50 text-emerald-900",
  note: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: keyof typeof CALLOUT_STYLES;
  title?: string;
  children: React.ReactNode;
}) {
  const label = title ?? { tip: "Tip", note: "Note", warning: "Important" }[type];
  return (
    <div className={`my-5 rounded-lg border px-4 py-3 text-sm ${CALLOUT_STYLES[type]}`}>
      <p className="mb-1 font-semibold">{label}</p>
      <div className="leading-relaxed [&_a]:underline">{children}</div>
    </div>
  );
}

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="my-5 space-y-5">{children}</ol>;
}

export function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
        {n}
      </span>
      <div className="pt-0.5">
        <p className="font-medium text-slate-900">{title}</p>
        {children ? <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div> : null}
      </div>
    </li>
  );
}

// Previous / next step links at the bottom of a guide page.
export function PrevNext({ current }: { current: string }) {
  const idx = GUIDE_STEPS.findIndex((s) => s.slug === current);
  const prev = idx > 0 ? GUIDE_STEPS[idx - 1] : null;
  const next = idx >= 0 && idx < GUIDE_STEPS.length - 1 ? GUIDE_STEPS[idx + 1] : null;
  return (
    <div className="mt-12 flex items-stretch justify-between gap-4 border-t border-slate-200 pt-6">
      {prev ? (
        <Link href={prev.href} className="group flex-1 rounded-xl border border-slate-200 p-4 hover:border-slate-400">
          <span className="text-xs text-slate-400">← Previous</span>
          <span className="block font-medium text-slate-900 group-hover:underline">{prev.title}</span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
      {next ? (
        <Link href={next.href} className="group flex-1 rounded-xl border border-slate-200 p-4 text-right hover:border-slate-400">
          <span className="text-xs text-slate-400">Next →</span>
          <span className="block font-medium text-slate-900 group-hover:underline">{next.title}</span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </div>
  );
}
