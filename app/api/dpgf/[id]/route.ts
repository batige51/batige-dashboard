import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";

/** PATCH /api/dpgf/[id]  body: { code?, description?, unite?, qty?, unitPriceHt? } */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lid = parseInt(id, 10);
  if (isNaN(lid)) return NextResponse.json({ error: "ID ligne invalide" }, { status: 400 });

  const b = await req.json();

  // recalcul total si qty ou unitPrice changent
  const qty: number | undefined = b.qty != null ? Number(b.qty) : undefined;
  const unit: number | undefined = b.unitPriceHt != null ? Number(b.unitPriceHt) : undefined;

  // on lit l’existant pour calculer le total
  const existing = await prisma.dpgfLine.findUnique({ where: { id: lid } });
  if (!existing) return NextResponse.json({ error: "Ligne introuvable" }, { status: 404 });

  const finalQty = qty != null ? qty : existing.qty;
  const finalUnit = unit != null ? unit : existing.unitPriceHt;
  const totalHt = finalQty * finalUnit;

  const updated = await prisma.dpgfLine.update({
    where: { id: lid },
    data: {
      code: b.code ?? existing.code,
      description: b.description ?? existing.description,
      unite: b.unite ?? existing.unite,
      qty: finalQty,
      unitPriceHt: finalUnit,
      totalHt,
    },
  });
  return NextResponse.json(updated);
}

/** DELETE /api/dpgf/[id] */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lid = parseInt(id, 10);
  if (isNaN(lid)) return NextResponse.json({ error: "ID ligne invalide" }, { status: 400 });

  // sécurité: refuser la suppression si la ligne a déjà du validé
  const existing = await prisma.dpgfLine.findUnique({ where: { id: lid } });
  if (!existing) return NextResponse.json({ error: "Ligne introuvable" }, { status: 404 });
  if ((existing.validatedHt || 0) > 0) {
    return NextResponse.json({ error: "Impossible de supprimer : des validations existent" }, { status: 409 });
  }

  await prisma.dpgfLine.delete({ where: { id: lid } });
  return NextResponse.json({ ok: true });
}
