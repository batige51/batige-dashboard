import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

// POST /api/pp/generate?factureId=1
export async function POST(req: Request) {
  const url = new URL(req.url);
  const factureId = parseInt(url.searchParams.get("factureId") || "", 10);
  if (isNaN(factureId)) return NextResponse.json({ error: "factureId requis" }, { status: 400 });

  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    include: { lignes: true },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const dpgf = await prisma.dpgfLine.findMany({ where: { marcheId: facture.marcheId } });
  const map = new Map(dpgf.map(l => [l.id, l]));

  const ppLines = facture.lignes.map(fl => {
    const d = map.get(fl.dpgfLineId);
    const total = d?.totalHt ?? 0;
    const afterCumul = d?.validatedHt ?? 0; // déjà incrémenté par /valider
    const current = fl.validatedHt || 0;
    const previous = Math.max(0, afterCumul - current);
    const remaining = Math.max(0, total - (previous + current));
    return { dpgfLineId: fl.dpgfLineId, previousHt: previous, currentHt: current, remainingHt: remaining };
  });
  const totalHt = ppLines.reduce((s, l) => s + l.currentHt, 0);

  const old = await prisma.propositionPaiement.findUnique({ where: { factureId } });
  if (old) {
    await prisma.ppLine.deleteMany({ where: { ppId: old.id } });
    await prisma.propositionPaiement.delete({ where: { id: old.id } });
  }

  const pp = await prisma.propositionPaiement.create({
    data: { factureId, totalHt, lines: { create: ppLines } },
    include: { lines: true },
  });

  return NextResponse.json(pp, { status: 201 });
}
