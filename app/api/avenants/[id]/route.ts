import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const aid = parseInt(id, 10);
  if (isNaN(aid)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const a = await prisma.avenantEntreprise.findUnique({
    where: { id: aid },
    include: { lines: { include: { dpgfLine: true } }, marche: true },
  });
  if (!a) return NextResponse.json({ error: "Avenant introuvable" }, { status: 404 });
  return NextResponse.json(a);
}
