import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/validation/pp
 * body: { marcheId: number, lineIds: number[] }
 * - crée Facture + PP avec les lignes DPGF cochées
 * - SI pendingAcompteHt > 0 => ajoute une ligne PP NEGATIVE “Regul acompte” et remet pendingAcompteHt à 0
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const marcheId = Number(body?.marcheId);
  const lineIds: number[] = Array.isArray(body?.lineIds) ? body.lineIds.map(Number) : [];

  if (!marcheId || lineIds.length === 0) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const marche = await prisma.marche.findUnique({
    where: { id: marcheId },
    select: { id: true, projectId: true, entrepriseId: true, pendingAcompteHt: true },
  });
  if (!marche) return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });

  const dpgfLines = await prisma.dpgfLine.findMany({ where: { id: { in: lineIds }, marcheId } });

  const facture = await prisma.facture.create({
    data: {
      projectId: marche.projectId,
      entrepriseId: marche.entrepriseId,
      marcheId: marche.id,
      numero: `FAC-${Date.now()}`,
      date: new Date(),
      tvaRate: 20,
    },
  });

  // Lignes PP depuis DPGF
  const ppLines = dpgfLines.map((l) => ({
    dpgfLineId: l.id,
    previousHt: Number(l.validatedHt ?? 0),
    currentHt: Number(l.totalHt ?? 0) - Number(l.validatedHt ?? 0),
    remainingHt: 0,
  }));

  let totalHt = ppLines.reduce((s, it) => s + it.currentHt, 0);

  // 👇 si acompte à régulariser : ligne négative automatique
  if ((marche.pendingAcompteHt || 0) > 0) {
    const regul = Number(marche.pendingAcompteHt || 0);

    // crée (au besoin) une DPGF technique pour tracer la régul
    const dpgfRegul = await prisma.dpgfLine.create({
      data: {
        marcheId,
        code: "ACOMPTE-REGUL",
        description: "Régularisation acompte (ligne auto)",
        unite: "U",
        qty: 1,
        unitPriceHt: -regul,
        totalHt: -regul,
        lot: "ACOMPTE",
        idx: 999901,
      },
    });

    ppLines.push({
      dpgfLineId: dpgfRegul.id,
      previousHt: 0,
      currentHt: -regul,
      remainingHt: 0,
    });

    totalHt -= regul;

    // remet à zéro pour les PP suivantes
    await prisma.marche.update({
      where: { id: marcheId },
      data: { pendingAcompteHt: 0 },
    });
  }

  const pp = await prisma.propositionPaiement.create({
    data: {
      factureId: facture.id,
      numero: `PP-${Date.now()}`,
      totalHt,
      lines: { create: ppLines },
    },
  });

  // met à jour les cumuls validés côté DPGF
  for (const l of ppLines) {
    await prisma.dpgfLine.update({
      where: { id: l.dpgfLineId },
      data: { validatedHt: { increment: l.currentHt } },
    });
  }

  return NextResponse.json({ item: { pp } }, { status: 201 });
}
