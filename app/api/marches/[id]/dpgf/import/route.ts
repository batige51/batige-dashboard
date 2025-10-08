import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

type Row = {
  code?: string | null;
  description: string;
  unite?: string | null;
  qty?: number | string | null;
  unitPriceHt?: number | string | null;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const marcheId = parseInt(id, 10);
  if (isNaN(marcheId)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const url = new URL(req.url);
  const clear = url.searchParams.get("clear") === "1";

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body)) return NextResponse.json({ error: "JSON array attendu" }, { status: 400 });

  const rows: Row[] = body;

  const data = rows
    .filter((r) => r && r.description)
    .map((r, idx) => {
      const qty = Number((r.qty as any) ?? 0) || 0;
      const up = Number((r.unitPriceHt as any) ?? 0) || 0;
      const totalHt = qty * up;
      return {
        marcheId,
        code: (r.code ?? null) as string | null,
        description: String(r.description),
        unite: (r.unite ?? null) as string | null,
        qty,
        unitPriceHt: up,
        totalHt,
        idx,
      };
    });

  const result = await prisma.$transaction(async (tx) => {
    if (clear) {
      await tx.dpgfLine.deleteMany({ where: { marcheId } });
    }
    if (data.length > 0) {
      await tx.dpgfLine.createMany({ data });
    }
    const count = await tx.dpgfLine.count({ where: { marcheId } });
    return { inserted: data.length, total: count, cleared: clear };
  });

  return NextResponse.json(result, { status: 201 });
}
