import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(_req: Request, ctx: { params: Promise<{ factureId: string }> }) {
  const { factureId } = await ctx.params;
  const fid = parseInt(factureId, 10);
  if (isNaN(fid)) return NextResponse.json({ error: "ID facture invalide" }, { status: 400 });

  const facture = await prisma.facture.findUnique({
    where: { id: fid },
    include: {
      project: true,
      entreprise: true,
      marche: true,
      lignes: { include: { dpgf: true }, orderBy: { id: "asc" } },
      pp: true,
    },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  if (facture.pp) {
    return NextResponse.json(
      { error: "PP déjà existante pour cette facture", ppId: facture.pp.id },
      { status: 409 }
    );
  }

  // Lignes PP (précédent / courant / restant)
  const rows = (facture.lignes || []).map((fl) => {
    const d = fl.dpgf!;
    const previousHt = Math.max(0, (d.validatedHt || 0) - (fl.validatedHt || 0));
    const currentHt = (fl.validatedHt != null ? fl.validatedHt : fl.requestedHt) || 0;
    const remainingHt = Math.max(0, (d.totalHt || 0) - (previousHt + currentHt));
    return { dpgfLineId: d.id, previousHt, currentHt, remainingHt };
  });

  // Numérotation PP-YYYY-####
  const year = new Date().getFullYear();
  const prefix = `PP-${year}-`;
  const last = await prisma.propositionPaiement.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  let nextIndex = 1;
  if (last?.numero) {
    const m = last.numero.match(/^PP-\d{4}-(\d{4})$/);
    if (m) nextIndex = parseInt(m[1], 10) + 1;
  }
  const numero = `${prefix}${String(nextIndex).padStart(4, "0")}`;

  // Transaction
  const created = await prisma.$transaction(async (tx) => {
    const pp = await tx.propositionPaiement.create({
      data: { numero, factureId: facture.id },
    });
    await tx.ppLine.createMany({
      data: rows.map((r) => ({ ...r, ppId: pp.id })),
    });
    return pp;
  });

  return NextResponse.json({ id: created.id, numero: created.numero }, { status: 201 });
}
