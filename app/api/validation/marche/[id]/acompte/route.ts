import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/validation/marche/[id]/acompte
 * body: { amount: number }
 *
 * Effet:
 * 1) Crée une PP "PP-ACOMPTE-<ts>" qui valide immédiatement une ligne DPGF technique "ACOMPTE" de +amount.
 * 2) Crée une seconde ligne DPGF technique "ACOMPTE-REGUL" de -amount, NON validée (ouverte).
 *    Cette ligne apparaitra dans Validation et sera pré-cochée/ verrouillée côté UI.
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const marcheId = Number(id);
  const body = await req.json().catch(() => ({}));
  const amount = Math.abs(Number(body?.amount ?? 0));

  if (!marcheId || !amount) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // 1) Crée la ligne "ACOMPTE" (+amount) et la PP d'acompte qui la valide immédiatement
  const lineAcompte = await prisma.dpgfLine.create({
    data: {
      marcheId,
      code: "ACOMPTE",
      description: "Acompte (ligne technique)",
      lot: "ACOMPTE",
      qty: 1,
      unitPriceHt: amount,
      totalHt: amount,
      validatedHt: 0,
    },
  });

  const facture = await prisma.facture.create({
    data: {
      projectId: (await prisma.marche.findUnique({ where: { id: marcheId }, select: { projectId: true } }))!.projectId,
      entrepriseId: (await prisma.marche.findUnique({ where: { id: marcheId }, select: { entrepriseId: true } }))!.entrepriseId,
      marcheId,
      numero: `FAC-ACOMPTE-${Date.now()}`,
      tvaRate: 20,
      retenuePct: 0,
      isDgd: false,
    },
  });

  const pp = await prisma.propositionPaiement.create({
    data: {
      factureId: facture.id,
      numero: `PP-ACOMPTE-${Date.now()}`,
      totalHt: amount,
      lines: {
        create: [
          {
            dpgfLineId: lineAcompte.id,
            previousHt: 0,
            currentHt: amount,
            remainingHt: 0,
          },
        ],
      },
    },
    include: { lines: true },
  });

  // met à jour la ligne pour marquer validé = +amount
  await prisma.dpgfLine.update({
    where: { id: lineAcompte.id },
    data: { validatedHt: { increment: amount } }, // donc remaining = 0
  });

  // 2) Crée la ligne "ACOMPTE-REGUL" (−amount), ouverte
  const lineRegul = await prisma.dpgfLine.create({
    data: {
      marcheId,
      code: "ACOMPTE-REGUL",
      description: "Régularisation acompte (ligne auto)",
      lot: "ACOMPTE-REGUL",
      qty: 1,
      unitPriceHt: -amount,
      totalHt: -amount,
      validatedHt: 0, // rien validé pour l'instant → elle apparaitra avec remaining = -amount
    },
  });

  return NextResponse.json(
    {
      ok: true,
      ppId: pp.id,
      acompteLineId: lineAcompte.id,
      regulLineId: lineRegul.id,
    },
    { status: 200 }
  );
}
