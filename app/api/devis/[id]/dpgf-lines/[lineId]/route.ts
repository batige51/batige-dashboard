import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";


/**
 * DELETE /api/devis/:id/dpgf-lines/:lineId
 * Supprime UNE ligne DPGF du devis.
 */
export async function DELETE(_req: NextRequest, context: unknown) {
  // On évite le typage du 2e argument pour Next 15, puis on caste en interne :
  const { params } = context as { params: { id: string; lineId: string } };

  const marcheId = Number(params.id);
  const lineId = Number(params.lineId);

  if (!Number.isFinite(marcheId) || !Number.isFinite(lineId)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const line = await prisma.dpgfLine.findUnique({ where: { id: lineId } });
    if (!line || line.marcheId !== marcheId) {
      return NextResponse.json(
        { error: "Ligne introuvable pour ce devis" },
        { status: 404 }
      );
    }

    await prisma.dpgfLine.delete({ where: { id: lineId } });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Delete failed" },
      { status: 400 }
    );
  }
}
