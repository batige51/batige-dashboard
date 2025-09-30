import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * POST /api/pp/commit/[id]  (id = facture)
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return NextResponse.json({ error: "ID facture invalide" }, { status: 400 });

  const facture = await prisma.facture.findUnique({
    where: { id: fid },
    include: {
      pp: true,
      lignes: { include: { dpgf: true }, orderBy: { id: "asc" } },
      project: true,
      entreprise: true,
      marche: true,
    },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  if (facture.pp) return NextResponse.json({ error: "PP déjà existante", ppId: facture.pp.id }, { status: 409 });

  const rows = (facture.lignes || []).map((fl) => {
    const d = fl.dpgf!;
    const previousHt = Math.max(0, (d.validatedHt || 0) - (fl.validatedHt || 0));
    const currentHt = (fl.validatedHt != null ? fl.validatedHt : fl.requestedHt) || 0;
    const remainingHt = Math.max(0, (d.totalHt || 0) - (previousHt + currentHt));
    return { dpgfLineId: d.id, previousHt, currentHt, remainingHt };
  });

  // Générer PP-YYYY-####
  const year = new Date().getFullYear();
  const prefix = `PP-${year}-`;
  const last = await prisma.propositionPaiement.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  let seq = 1;
  if (last?.numero) {
    const n = parseInt(last.numero.replace(prefix, ""), 10);
    if (!isNaN(n)) seq = n + 1;
  }
  const numero = `${prefix}${String(seq).padStart(4, "0")}`;

  const created = await prisma.$transaction(async (tx) => {
    const pp = await tx.propositionPaiement.create({
      data: {
        factureId: fid,
        numero,
        totalHt: rows.reduce((s, r) => s + r.currentHt, 0),
        lines: { createMany: { data: rows } },
      },
    });
    return pp;
  });

  return NextResponse.json({ id: created.id, numero: created.numero }, { status: 201 });
}
