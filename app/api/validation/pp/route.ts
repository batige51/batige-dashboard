import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/validation/pp
 * body: {
 *   marcheId: number,
 *   lines: [{ id: number, validatedHt: number }]
 * }
 * - crée Facture + PP avec les lignes DPGF cochées
 * - SI pendingAcompteHt > 0 => ajoute une ligne PP NEGATIVE “Regul acompte” et remet pendingAcompteHt à 0
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const marcheId = Number(body?.marcheId);
  const lines: { id: number; validatedHt: number }[] = Array.isArray(body?.lines)
    ? body.lines
        .filter((l: any) => l && typeof l.id === "number")
        .map((l: any) => ({
          id: Number(l.id),
          validatedHt: Number(l.validatedHt ?? 0),
        }))
    : [];

  if (!marcheId || lines.length === 0) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const marche = await prisma.marche.findUnique({
    where: { id: marcheId },
    select: { id: true, projectId: true, entrepriseId: true, pendingAcompteHt: true },
  });
  if (!marche) return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });

  const lineIds = lines.map((l) => l.id);
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

  // 🔁 Lignes PP avec montant partiel
  const ppLines = dpgfLines.map((l) => {
    const progress = lines.find((x) => x.id === l.id);
    const validatedHt = Number(progress?.validatedHt ?? 0);
    const previousHt = Number(l.validatedHt ?? 0);
    const totalHt = Number(l.totalHt ?? 0);

    // le courant correspond à la partie validée maintenant
    const currentHt = Math.min(validatedHt, totalHt - previousHt);

    return {
      dpgfLineId: l.id,
      previousHt,
      currentHt,
      remainingHt: Math.max(totalHt - previousHt - currentHt, 0),
    };
  });

  let totalHt = ppLines.reduce((s, it) => s + it.currentHt, 0);

  // 👇 si acompte à régulariser : ligne négative automatique
  if ((marche.pendingAcompteHt || 0) > 0) {
    const regul = Number(marche.pendingAcompteHt || 0);

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

  // 🔁 Mise à jour des cumuls validés côté DPGF + création d'une nouvelle ligne pour le solde restant
  for (const l of ppLines) {
    if (l.currentHt === 0) continue;

    // 🔸 On met à jour le validé cumulé sur la ligne d’origine
    const updated = await prisma.dpgfLine.update({
      where: { id: l.dpgfLineId },
      data: { validatedHt: { increment: l.currentHt } },
    });

    // 🔸 On calcule le restant à valider
    const remaining = Math.max(
      Number(updated.totalHt ?? 0) - Number(updated.validatedHt ?? 0),
      0
    );

    // 🔸 Si tout n’est pas validé, on crée une nouvelle ligne avec le reste à valider
    if (remaining > 0.01) {
      await prisma.dpgfLine.create({
        data: {
          marcheId,
          code: updated.code,
          description: updated.description,
          unite: updated.unite,
          qty: updated.qty,
          unitPriceHt: updated.unitPriceHt,
          totalHt: remaining, // ← uniquement le solde
          validatedHt: 0,
          lot: updated.lot,
          idx: (updated.idx ?? 0) + 1, // pour l’afficher juste après
        },
      });
    }
  }

  return NextResponse.json({ item: { pp } }, { status: 201 });
}
