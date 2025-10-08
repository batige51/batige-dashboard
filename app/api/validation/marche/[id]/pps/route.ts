import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/validation/marche/:id/pps */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;                // ⬅️ IMPORTANT
  const marcheId = Number(id);
  if (!marcheId) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const pps = await prisma.propositionPaiement.findMany({
    where: { lines: { some: { dpgfLine: { marcheId } } } },
    include: { lines: true },
    orderBy: { id: "asc" },
  });

  const items = pps.map((pp, idx) => ({
    id: pp.id,
    label: `PP${idx + 1}` + (pp.numero ? ` — ${pp.numero}` : ""),
    totalHt: (pp.lines || []).reduce((s, l) => s + Number(l.currentHt ?? 0), 0),
  }));

  return NextResponse.json({ items });
}
