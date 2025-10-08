import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

type LotRow = {
  numero: string;
  typologie?: string | null;
  surface?: number | string | null;
  prix_catalogue_ht?: number | string | null;
};

function numFR(v: any) {
  if (v == null) return 0;
  const s = String(v).replace(/\u00a0/g," ").replace(/\s/g,"").replace(",",".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }>}) {
  const { projectId } = await ctx.params;
  const pid = parseInt(projectId, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });

  const url = new URL(req.url);
  const clear = url.searchParams.get("clear") === "1";

  const rows: LotRow[] = await req.json().catch(() => null as any);
  if (!Array.isArray(rows)) return NextResponse.json({ error: "JSON array attendu" }, { status: 400 });

  const data = rows
    .filter(r => r && r.numero)
    .map(r => ({
      projectId: pid,
      numero: String(r.numero).trim(),
      typologie: (r.typologie ?? null) as string | null,
      surface: numFR(r.surface),
      prixCatalogueHt: numFR(r.prix_catalogue_ht),
    }));

  const result = await prisma.$transaction(async (tx) => {
    if (clear) await tx.lot.deleteMany({ where: { projectId: pid } });
    if (data.length) await tx.lot.createMany({ data });
    const count = await tx.lot.count({ where: { projectId: pid } });
    return { inserted: data.length, total: count, cleared: clear };
  });

  return NextResponse.json(result, { status: 201 });
}
