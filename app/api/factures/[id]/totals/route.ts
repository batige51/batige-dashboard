import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const f = await prisma.facture.findUnique({
    where: { id: fid },
    include: { lignes: true },
  });
  if (!f) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const baseHt = (f.lignes || []).reduce((s, l) => s + (l.validatedHt ?? l.requestedHt ?? 0), 0);
  const tva = baseHt * (f.tvaRate / 100);
  const rgRetenue = f.isDgd ? 0 : baseHt * (f.retenuePct / 100);
  const ttcAPayer = baseHt + tva - rgRetenue;

  return NextResponse.json({
    factureId: f.id,
    params: { tvaRate: f.tvaRate, retenuePct: f.retenuePct, isDgd: f.isDgd },
    totals: {
      baseHt,
      tva,
      rgRetenue,
      ttcAPayer,
    },
  });
}
