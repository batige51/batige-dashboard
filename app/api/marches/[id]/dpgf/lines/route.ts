import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** POST /api/marches/[id]/dpgf/lines  body: { code?, description, unite?, qty, unitPriceHt } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const marcheId = parseInt(id, 10);
  if (isNaN(marcheId)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const b = await req.json();
  const qty = Number(b.qty ?? 0);
  const unit = Number(b.unitPriceHt ?? 0);
  const totalHt = qty * unit;

  const created = await prisma.dpgfLine.create({
    data: {
      marcheId,
      code: b.code ?? null,
      description: String(b.description || "Ligne"),
      unite: b.unite ?? null,
      qty, unitPriceHt: unit, totalHt,
      validatedHt: 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
