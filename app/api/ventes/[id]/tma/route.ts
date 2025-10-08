import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

// Ajoute une ligne TMA (+/-) à une vente, et met à jour le total TMA de la vente
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const vid = parseInt(id, 10);
  if (isNaN(vid)) return NextResponse.json({ error: "ID vente invalide" }, { status: 400 });

  const body = await req.json().catch(()=>null) as {
    code?: string;
    description: string;
    deltaHt: number;  // + pour plus-value, - pour moins-value
  } | null;

  if (!body || typeof body.deltaHt !== "number" || !body.description) {
    return NextResponse.json({ error: "description et deltaHt requis" }, { status: 400 });
  }

  const vente = await prisma.venteActee.findUnique({ where: { id: vid } });
  if (!vente) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

  // transaction: créer TMA + recalculer tmaTotalHt
  const updated = await prisma.$transaction(async (tx) => {
    await tx.tmaLine.create({
      data: { venteId: vid, code: body.code || null, description: body.description, deltaHt: body.deltaHt },
    });

    const tmas = await tx.tmaLine.findMany({ where: { venteId: vid } });
    const total = tmas.reduce((s, l)=> s + (l.deltaHt || 0), 0);

    const v = await tx.venteActee.update({
      where: { id: vid },
      data: { tmaTotalHt: total },
    });

    return v;
  });

  return NextResponse.json(updated);
}
