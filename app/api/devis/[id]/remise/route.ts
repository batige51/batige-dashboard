import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** PUT /api/devis/[id]/remise  { amount: number }
 * amount > 0  => on enregistre -amount dans Marche.remiseHt (remise négative)
 */
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const marcheId = Number(id);
  const body = await req.json().catch(()=> ({}));
  const amount = Number(body?.amount ?? 0);
  if (!marcheId || isNaN(amount)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  // on stocke négatif (remise)
  const remise = -Math.abs(amount);

  const m = await prisma.marche.update({
    where: { id: marcheId },
    data: { remiseHt: { increment: remise } },
    select: { id: true, remiseHt: true },
  });

  return NextResponse.json({ item: m }, { status: 200 });
}
