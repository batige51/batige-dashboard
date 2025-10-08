import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";

/** GET /api/ventes/[id] (id = lot) */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lotId = parseInt(id, 10);
  if (isNaN(lotId)) return NextResponse.json({ error: "ID lot invalide" }, { status: 400 });

  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: { ventes: { include: { tmas: true } } },
  });
  if (!lot) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });

  return NextResponse.json(lot);
}

/** POST /api/ventes/[id]  body: { client, prixVenteHt, tvaRate } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lotId = parseInt(id, 10);
  if (isNaN(lotId)) return NextResponse.json({ error: "ID lot invalide" }, { status: 400 });

  const b = await req.json();
  const v = await prisma.venteActee.create({
    data: {
      lotId,
      client: String(b.client || "Client"),
      prixVenteHt: parseFloat(b.prixVenteHt || 0) || 0,
      tvaRate: parseFloat(b.tvaRate || 20) || 0,
    },
  });
  return NextResponse.json(v, { status: 201 });
}
