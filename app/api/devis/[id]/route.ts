import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/devis/:id
 * Détail d’un devis (marché) avec projet, entreprise, lignes DPGF et avenants.
 */
export async function GET(_req: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  const marcheId = Number(params.id);

  if (!marcheId) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  const marche = await prisma.marche.findUnique({
    where: { id: marcheId },
    include: {
      project: true,
      entreprise: true,
      dpgf: true,
      AvenantEntreprise: { include: { lines: true } },
    },
  });

  if (!marche) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  // on remet en forme pour le front
  const payload = {
    marche: {
      id: marche.id,
      reference: marche.reference,
      project: { id: marche.projectId, name: marche.project.name },
      entreprise: { id: marche.entrepriseId, name: marche.entreprise.name },
    },
    dpgf: (marche.dpgf ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      description: l.description,
      qty: l.qty,
      unitPriceHt: l.unitPriceHt,
      totalHt: l.totalHt,
      lot: l.lot,
    })),
    avenants: (marche.AvenantEntreprise ?? []).map((a) => ({
      id: a.id,
      numero: a.numero,
      date: a.date,
      statut: a.statut,
      lines: (a.lines ?? []).map((li) => ({
        id: li.id,
        dpgfLineId: li.dpgfLineId,
        deltaHt: li.deltaHt,
      })),
    })),
  };

  return NextResponse.json(payload, { status: 200 });
}

/**
 * DELETE /api/devis/:id
 * Supprime le devis et ce qui est rattaché (Cascade côté Prisma).
 */
export async function DELETE(_req: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  const marcheId = Number(params.id);

  if (!marcheId) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  try {
    await prisma.marche.delete({ where: { id: marcheId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Suppression impossible" }, { status: 400 });
  }
}
