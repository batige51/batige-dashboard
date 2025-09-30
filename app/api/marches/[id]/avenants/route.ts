import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** GET /api/marches/[id]/avenants */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mid = parseInt(id, 10);
  if (isNaN(mid)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const list = await prisma.avenantEntreprise.findMany({
    where: { marcheId: mid },
    include: { lines: true },
    orderBy: { date: "desc" },
  });

  const out = list.map((av) => ({
    id: av.id, numero: av.numero, statut: av.statut, date: av.date,
    deltaHt: (av.lines||[]).reduce((s,l)=> s + (l.deltaHt||0), 0),
    lines: av.lines?.length || 0
  }));
  return NextResponse.json(out);
}
