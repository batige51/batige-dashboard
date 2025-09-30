import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET /api/pp/view?factureId=1
export async function GET(req: Request) {
  const url = new URL(req.url);
  const factureId = parseInt(url.searchParams.get("factureId") || "", 10);
  if (isNaN(factureId)) return NextResponse.json({ error: "factureId requis" }, { status: 400 });

  const pp = await prisma.propositionPaiement.findUnique({
    where: { factureId },
    include: { lines: true },
  });
  if (!pp) return NextResponse.json({ error: "PP introuvable" }, { status: 404 });

  const dpgf = await prisma.dpgfLine.findMany({ where: { id: { in: pp.lines.map(l => l.dpgfLineId) } } });
  const map = new Map(dpgf.map(l => [l.id, { code: l.code, description: l.description }]));
  const lines = pp.lines.map(l => ({ ...l, dpgfLine: map.get(l.dpgfLineId) || null }));

  return NextResponse.json({ ...pp, lines });
}
