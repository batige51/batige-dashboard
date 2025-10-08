import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pid = parseInt(id, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID PP invalide" }, { status: 400 });

  const pp = await prisma.propositionPaiement.findUnique({
    where: { id: pid },
    include: {
      facture: { include: { project: true, entreprise: true, marche: true } },
      lines: { include: { dpgfLine: true }, orderBy: { id: "asc" } },
    },
  });
  if (!pp) return NextResponse.json({ error: "PP introuvable" }, { status: 404 });

  const rows = pp.lines.map((l) => ({
    dpgfLineId: l.dpgfLineId,
    code: l.dpgfLine?.code,
    description: l.dpgfLine?.description,
    totalHt: l.dpgfLine?.totalHt || 0,
    previousHt: l.previousHt,
    currentHt: l.currentHt,
    remainingHt: l.remainingHt,
  }));
  const totals = rows.reduce(
    (a, r) => {
      a.total += r.totalHt;
      a.previous += r.previousHt;
      a.current += r.currentHt;
      a.remaining += r.remainingHt;
      return a;
    },
    { total: 0, previous: 0, current: 0, remaining: 0 }
  );

  return NextResponse.json({
    header: {
      pp: { id: pp.id, numero: pp.numero, createdAt: pp.createdAt },
      facture: {
        id: pp.facture.id,
        numero: pp.facture.numero,
        date: pp.facture.date,
        statut: pp.facture.statut,
      },
      marche: { id: pp.facture.marche.id, reference: pp.facture.marche.reference },
      entreprise: { id: pp.facture.entreprise.id, name: pp.facture.entreprise.name },
      project: { id: pp.facture.project.id, name: pp.facture.project.name },
    },
    rows,
    totals,
  });
}
