import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const marcheId = parseInt(id, 10);
  if (isNaN(marcheId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const marche = await prisma.marche.findUnique({
    where: { id: marcheId },
    include: {
      project: true,
      entreprise: true,
      dpgf: { select: { id: true, code: true, totalHt: true, validatedHt: true, description: true } },
    },
  });

  if (!marche) return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });
  return NextResponse.json(marche);
}
