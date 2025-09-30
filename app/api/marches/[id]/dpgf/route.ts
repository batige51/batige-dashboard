import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const marcheId = parseInt(params.id, 10);

  if (isNaN(marcheId)) {
    return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });
  }

  try {
    const lignes = await prisma.dpgfLine.findMany({
      where: { marcheId },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(lignes);
  } catch (e: any) {
    console.error("Erreur DPGF:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
