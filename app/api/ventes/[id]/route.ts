import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Lit une vente avec son lot et ses TMA
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const vid = parseInt(id, 10);
  if (isNaN(vid)) return NextResponse.json({ error: "ID vente invalide" }, { status: 400 });

  const vente = await prisma.venteActee.findUnique({
    where: { id: vid },
    include: {
      lot: true,
      tmas: { orderBy: { id: "asc" } },
    },
  });
  if (!vente) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

  // Total TMA recalculé pour cohérence
  const tmaTotal = (vente.tmas || []).reduce((s, l)=> s + (l.deltaHt || 0), 0);

  return NextResponse.json({ ...vente, tmaTotalHt: tmaTotal });
}
