import { NextResponse } from "next/server";
import { getSession, canEdit } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { ENTITY_SPECS, type EntityKey } from "@/lib/entity-csv";

type Params = { params: Promise<{ entity: string }> };

// Download a catalog entity as CSV.
export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  if (!canEdit(session.role)) return new NextResponse(null, { status: 403 });

  const { entity } = await params;
  const spec = ENTITY_SPECS[entity as EntityKey];
  if (!spec) return new NextResponse(null, { status: 404 });

  const rows = await spec.exportRows();
  const csv = toCsv(spec.headers, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${spec.filename}"`,
    },
  });
}
