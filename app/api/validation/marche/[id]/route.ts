import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


/**
 * GET /api/validation/marche/[id]
 * Retourne un marché avec un sous-ensemble de champs pour l'écran Validation.
 * (réponse allégée → meilleures perfs)
 */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const marcheId = Number(id);
  if (!marcheId) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const marche = await prisma.marche.findUnique({
    where: { id: marcheId },
    select: {
      id: true,
      reference: true,
      project: { select: { id: true, name: true } },
      entreprise: { select: { id: true, name: true } },
      dpgf: {
        select: {
          id: true,
          code: true,
          description: true,
          totalHt: true,
          validatedHt: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!marche) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  const dpgf = (marche.dpgf || []).map((l) => ({
    ...l,
    remainingHt: Number(l.totalHt ?? 0) - Number(l.validatedHt ?? 0),
  }));

  return NextResponse.json({
    item: {
      id: marche.id,
      reference: marche.reference,
      project: marche.project,
      entreprise: marche.entreprise,
      dpgf,
    },
  });
}

/**
 * GET /api/validation/marche/[id]/pps
 * (garde si tu as déjà ce fichier ailleurs, sinon fais un second fichier avec la même logique)
 * Ici je fournis une version minimaliste au cas où :
 */
export async function HEAD() {
  return NextResponse.json({ ok: true });
}
