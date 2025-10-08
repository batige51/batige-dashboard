import prisma from "@/lib/prisma";
import { FactureStatut } from "@prisma/client";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

// Body JSON attendu :
// { marcheId: number, numero?: string, lines: [{ dpgfLineId:number, amount?: number }] }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const marcheId = Number(body?.marcheId || 0);
  const numero = (body?.numero || "").trim() || undefined;
  const lines = Array.isArray(body?.lines) ? body.lines : [];

  if (!marcheId || !lines.length) {
    return NextResponse.json({ error: "marcheId et lines requis" }, { status: 400 });
  }

  const marche = await prisma.marche.findUnique({
    where: { id: marcheId },
    include: { project: true, entreprise: true, dpgf: true },
  });
  if (!marche) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  // Prépare les montants (sécurise le "remaining")
  const dpgfMap = new Map<number, { total: number; already: number }>();
  const dpgfWithPP = await prisma.dpgfLine.findMany({
    where: { marcheId },
    include: { ppLines: { select: { currentHt: true } } },
  });
  dpgfWithPP.forEach(l => {
    const total = l.totalHt ?? 0;
    const already = l.ppLines.reduce((s, x) => s + (x.currentHt ?? 0), 0);
    dpgfMap.set(l.id, { total, already });
  });

  const prepared = lines.map((x: any) => {
    const id = Number(x?.dpgfLineId || 0);
    const rec = dpgfMap.get(id);
    if (!id || !rec) return null;
    const remaining = Math.max(rec.total - rec.already, 0);
    const amount = Math.max(0, Number(x?.amount ?? remaining));
    return amount > 0 && remaining > 0 ? { dpgfLineId: id, amount: Math.min(amount, remaining) } : null;
  }).filter(Boolean) as { dpgfLineId:number; amount:number }[];

  if (!prepared.length) {
    return NextResponse.json({ error: "Aucun poste sélectionnable" }, { status: 400 });
  }

  const totalHt = prepared.reduce((s, l) => s + l.amount, 0);
  const factNum = numero || `PP-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,"")}`;

  // Transaction : crée Facture + PP + Lignes PP + maj cumul validé
  const created = await prisma.$transaction(async (tx) => {
    const facture = await tx.facture.create({
      data: {
        projectId: marche.projectId,
        entrepriseId: marche.entrepriseId,
        marcheId,
        numero: factNum,
        statut: FactureStatut.EN_ATTENTE,
      },
    });

    const pp = await tx.propositionPaiement.create({
      data: {
        factureId: facture.id,
        numero: factNum,
        totalHt,
      },
    });

    for (const l of prepared) {
      await tx.ppLine.create({
        data: {
          ppId: pp.id,
          dpgfLineId: l.dpgfLineId,
          previousHt: 0,
          currentHt: l.amount,
          remainingHt: 0,
        },
      });
      // Option : maintien d'un cumul rapide
      await tx.dpgfLine.update({
        where: { id: l.dpgfLineId },
        data: { validatedHt: { increment: l.amount } },
      });
    }

    return { facture, pp };
  });

  return NextResponse.json({
    ok: true,
    factureId: created.facture.id,
    ppId: created.pp.id,
    numero: factNum,
    totalHt,
  }, { status: 201 });
}
