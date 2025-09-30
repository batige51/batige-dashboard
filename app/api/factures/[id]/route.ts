import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const facture = await prisma.facture.findUnique({
    where: { id: fid },
    include: {
      project: true,
      marche: true,
      entreprise: true,
      lignes: { include: { dpgf: true }, orderBy: { id: "asc" } },
      pp: true,
    },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  return NextResponse.json(facture);
}
