import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** GET /api/marches/[id] */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mid = parseInt(id, 10);
  if (isNaN(mid)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const m = await prisma.marche.findUnique({
    where: { id: mid },
    include: { project: true, entreprise: true },
  });
  if (!m) return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });
  return NextResponse.json(m);
}

/** PATCH /api/marches/[id]  body: { reference?, montantInitialHt? } */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mid = parseInt(id, 10);
  if (isNaN(mid)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const b = await req.json();
  const data:any = {};
  if (b.reference !== undefined) data.reference = b.reference || null;
  if (b.montantInitialHt !== undefined) data.montantInitialHt = Number(b.montantInitialHt || 0);

  const updated = await prisma.marche.update({ where: { id: mid }, data });
  return NextResponse.json(updated);
}

