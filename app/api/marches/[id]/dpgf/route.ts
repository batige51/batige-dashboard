import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";


export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;      // ✅ Next 15: params est une Promise
  const marcheId = parseInt(id, 10);

  if (isNaN(marcheId)) {
    return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });
  }

  try {
    const lignes = await prisma.dpgfLine.findMany({
      where: { marcheId },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(lignes);
  } catch (e) {
    console.error("Erreur DPGF:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
