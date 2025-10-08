import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

// POST { marcheId:number }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const marcheId = Number(body?.marcheId || 0);
  if (!marcheId) return NextResponse.json({ error: "marcheId requis" }, { status: 400 });

  // Lignes DPGF + cumul déjà validé via PpLine (ou fallback sur dpgfLine.validatedHt)
  const lines = await prisma.dpgfLine.findMany({
    where: { marcheId },
    include: { ppLines: { select: { currentHt: true } } },
    orderBy: [{ lot: "asc" }, { code: "asc" }, { id: "asc" }],
  });

  const items = lines.map(l => {
    const total = l.totalHt ?? 0;
    const validatedViaPP = l.ppLines.reduce((s, x) => s + (x.currentHt ?? 0), 0);
    const validated = Math.max(validatedViaPP || (l.validatedHt ?? 0), 0);
    const remaining = Math.max(total - validated, 0);
    return {
      id: l.id,
      code: l.code ?? "",
      description: l.description,
      unite: l.unite ?? "",
      qty: l.qty ?? 0,
      unitPriceHt: l.unitPriceHt ?? 0,
      totalHt: total,
      validatedHt: validated,
      remainingHt: remaining,
      lot: l.lot ?? "",
      locked: remaining <= 0, // gris si tout déjà payé
    };
  });

  const totalHt = items.reduce((s,i)=>s+i.totalHt,0);
  const validatedHt = items.reduce((s,i)=>s+i.validatedHt,0);
  const remainingHt = items.reduce((s,i)=>s+i.remainingHt,0);

  return NextResponse.json({ items, totals: { totalHt, validatedHt, remainingHt } });
}
