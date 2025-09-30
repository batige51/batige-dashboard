import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * POST /api/factures/[id]/validate
 * body: { lines: Array<{ factureLineId: number, validatedHt: number }> }
 *
 * Règles:
 * - refuse si PP existe déjà (facture figée)
 * - refuse si validatedHt < 0
 * - refuse si (validated cumul futur) > totalHt de la DPGF line
 * - met à jour FactureLine.validatedHt et DpgfLine.validatedHt (cumul)
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const factureId = parseInt(id, 10);
  if (isNaN(factureId)) return NextResponse.json({ error: "ID facture invalide" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (lines.length === 0) return NextResponse.json({ error: "Aucune ligne fournie" }, { status: 400 });

  // Charger facture + PP (pour lock) + lignes concernées
  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    include: {
      pp: true,
      lignes: { include: { dpgf: true } },
    },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  if (facture.pp) return NextResponse.json({ error: "Facture figée (PP existante)" }, { status: 409 });

  // Indexer les lignes existantes par id
  const fLineById = new Map<number, typeof facture.lignes[number]>();
  facture.lignes.forEach((fl) => fLineById.set(fl.id, fl));

  // Vérifications
  for (const l of lines) {
    const fl = fLineById.get(Number(l.factureLineId));
    if (!fl) return NextResponse.json({ error: `Ligne ${l.factureLineId} introuvable` }, { status: 400 });

    const newValidated = Number(l.validatedHt ?? 0);
    if (!isFinite(newValidated) || newValidated < 0) {
      return NextResponse.json({ error: `Montant invalidé pour la ligne ${l.factureLineId}` }, { status: 400 });
    }

    const d = fl.dpgf;
    if (!d) return NextResponse.json({ error: `DPGF manquante pour la ligne ${l.factureLineId}` }, { status: 400 });

    const otherValidatedCumul = (d.validatedHt || 0) - (fl.validatedHt || 0);
    const futurCumul = otherValidatedCumul + newValidated;

    if (futurCumul > (d.totalHt || 0) + 1e-6) {
      return NextResponse.json({
        error: `Dépassement: ligne DPGF ${d.code || d.id}, cumul futur ${futurCumul} > total ${d.totalHt}`,
      }, { status: 400 });
    }
  }

  // Appliquer en transaction
  const updated = await prisma.$transaction(async (tx) => {
    const updates: any[] = [];

    for (const l of lines) {
      const fl = fLineById.get(Number(l.factureLineId))!;
      const newValidated = Number(l.validatedHt ?? 0);
      const delta = newValidated - (fl.validatedHt || 0);

      // Update FactureLine
      updates.push(
        tx.factureLine.update({
          where: { id: fl.id },
          data: { validatedHt: newValidated },
        })
      );

      // Update DpgfLine cumul
      updates.push(
        tx.dpgfLine.update({
          where: { id: fl.dpgfLineId },
          data: { validatedHt: (fl.dpgf!.validatedHt || 0) + delta },
        })
      );
    }

    await Promise.all(updates);
    return true;
  });

  return NextResponse.json({ ok: true });
}

