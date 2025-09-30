import { NextResponse } from "next/server";
import { PrismaClient, AvenantStatut } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const aid = parseInt(id, 10);
  if (isNaN(aid)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const updated = await prisma.avenantEntreprise.update({
    where: { id: aid },
    data: { statut: AvenantStatut.VALIDE },
  });
  return NextResponse.json(updated);
}
