import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * DELETE /api/dpgf-lines/:id
 * Supprime une ligne DPGF (si non utilisée ailleurs)
 */
export async function DELETE(_req: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  const id = Number(params.id);

  if (!id) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  // Vérifie que la ligne n’est pas utilisée ailleurs avant suppression
  const used = await prisma.factureLine.findFirst({ where: { dpgfLineId: id } });
  if (used) {
    return NextResponse.json(
      { error: "Impossible de supprimer : ligne déjà utilisée dans une facture" },
      { status: 400 }
    );
  }

  await prisma.dpgfLine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
