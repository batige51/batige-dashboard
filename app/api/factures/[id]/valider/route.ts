import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const factureId = parseInt(id, 10);
  if (isNaN(factureId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const body = await req.json();
  const items: Array<{ factureLineId: number; validatedHt: number }> = body?.lines || [];
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Payload vide" }, { status: 400 });
  }

  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    include: { lignes: true },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  // DPGF du marché lié
  const dpgfLines = await prisma.dpgfLine.findMany({
    where: { marcheId: facture.marcheId },
  });
  const dpgfMap = new Map<number, (typeof dpgfLines)[number]>();
  dpgfLines.forEach(l => dpgfMap.set(l.id, l));

  const updates = await prisma.$transaction(async (tx) => {
    const res: Array<{ factureLineId: number; dpgfLineId: number; currentValidated: number; remainingAfter: number }> = [];

    for (const it of items) {
      const line = facture.lignes.find((l) => l.id === it.factureLineId);
      if (!line) continue;

      const dpgf = dpgfMap.get(line.dpgfLineId);
      if (!dpgf) continue;

      const total = dpgf.totalHt || 0;
      const previous = dpgf.validatedHt || 0;
      const remaining = Math.max(0, total - previous);

      const asked = Math.max(0, Number(it.validatedHt || 0));
      const current = Math.min(asked, remaining); // clamp

      await tx.dpgfLine.update({
        where: { id: dpgf.id },
        data: { validatedHt: previous + current },
      });

      await tx.factureLine.update({
        where: { id: line.id },
        data: { validatedHt: current },
      });

      res.push({
        factureLineId: line.id,
        dpgfLineId: dpgf.id,
        currentValidated: current,
        remainingAfter: Math.max(0, total - (previous + current)),
      });
    }

    return res;
  });

  return NextResponse.json({ ok: true, updates });
}
