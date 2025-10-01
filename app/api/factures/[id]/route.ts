import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fid = Number(id);
  if (!Number.isFinite(fid)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const facture = await prisma.facture.findUnique({
    where: { id: fid },
    include: {
      project: true,
      marche: true,
      entreprise: true,
      lignes: { include: { dpgfLine: true }, orderBy: { id: "asc" } },
      pp: true,
    },
  });

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Alias "dpgf" -> "dpgfLine" pour compatibilité avec le front existant
  const normalized = {
    ...facture,
    lignes: (facture.lignes || []).map((l) => ({
      ...l,
      dpgf: l.dpgfLine,
    })),
  };

  return NextResponse.json(normalized);
}
