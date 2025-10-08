import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

/** POST /api/ventes/tma/[id]  (id = vente) body: { code?, description, deltaHt } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const vid = parseInt(id, 10);
  if (isNaN(vid)) return NextResponse.json({ error: "ID vente invalide" }, { status: 400 });

  const b = await req.json();
  const tma = await prisma.tmaLine.create({
    data: {
      venteId: vid,
      code: b.code ? String(b.code) : null,
      description: String(b.description || "TMA"),
      deltaHt: parseFloat(b.deltaHt || 0) || 0,
    },
  });
  return NextResponse.json(tma, { status: 201 });
}

