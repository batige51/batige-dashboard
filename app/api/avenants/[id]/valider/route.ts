import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AvenantStatut } from "@prisma/client";

export const runtime = "nodejs";

/**
 * POST /api/avenants/:id/valider
 * Valide un avenant (passe son statut à VALIDE)
 */
export async function POST(_req: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  const aid = Number(params.id);

  if (!Number.isFinite(aid)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    const updated = await prisma.avenantEntreprise.update({
      where: { id: aid },
      data: { statut: AvenantStatut.VALIDE },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erreur lors de la validation de l'avenant" },
      { status: 500 }
    );
  }
}
