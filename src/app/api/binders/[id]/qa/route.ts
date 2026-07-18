import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireBinderAccess } from "@/lib/binder-guard";
import { runBinderQa, listQaRuns, getQaRunReport } from "@/lib/binder-qa";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// A QA run with the AI layer can take a while on large binders.
export const maxDuration = 600;

// List QA runs; ?runId= returns that run's full report (scoped to this binder).
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const access = await requireBinderAccess(await getSession(), id, { write: false });
  if (!access.ok) return access.response;

  const runId = new URL(req.url).searchParams.get("runId");
  if (runId) {
    const report = await getQaRunReport(runId, id);
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ report });
  }
  return NextResponse.json({ runs: await listQaRuns(id) });
}

// Trigger a QA run (deterministic PDF checks + AI review). Synchronous.
// Blocked while the binder is in internal review.
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const access = await requireBinderAccess(session, id, { write: true });
  if (!access.ok) return access.response;

  const result = await runBinderQa(id, session!.userId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  const report = await getQaRunReport(result.runId, id);
  await logAudit({
    action: "binder.qa_run",
    actor: session!,
    targetType: "Binder",
    targetId: id,
    targetName: access.binder.journal.name,
    summary: report
      ? `AI QA run ${report.readyForPublication ? "PASSED" : "FAILED"} (${report.counts.fail} fail / ${report.counts.warn} review).`
      : "AI QA run completed.",
  });

  return NextResponse.json({ runId: result.runId, report });
}
