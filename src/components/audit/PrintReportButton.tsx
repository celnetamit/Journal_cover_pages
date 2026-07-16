"use client";

import { Printer } from "lucide-react";

export default function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      <Printer size={16} /> Print / Save PDF
    </button>
  );
}
