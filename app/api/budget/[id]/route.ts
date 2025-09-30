import { NextResponse } from "next/server";
import { PrismaClient, AvenantStatut } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(_req: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const pid = parseInt(projectId, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });

  // Marchés (coûts)
  const marches = await prisma.marche.findMany({
    where: { projectId: pid },
    include: { dpgf: true, entreprise: true },
    orderBy: { id: "asc" },
  });

  // Avenants validés
  const avenants = await prisma.avenantEntreprise.findMany({
    where: { marcheId: { in: marches.map(m => m.id) }, statut: AvenantStatut.VALIDE },
    include: { lines: true },
  });
  const deltasByMarche = new Map<number, number>();
  for (const a of avenants) {
    const sum = a.lines.reduce((s, l) => s + (l.deltaHt || 0), 0);
    deltasByMarche.set(a.marcheId, (deltasByMarche.get(a.marcheId) || 0) + sum);
  }

  // Ventes (recettes)
  const lots = await prisma.lot.findMany({ where: { projectId: pid }, select: { id: true } });
  const ventes = await prisma.venteActee.findMany({
    where: { lotId: { in: lots.map(l => l.id) } },
    select: { prixVenteHt: true, tmaTotalHt: true }
  });
  const ventesHt = ventes.reduce((s, v) => s + (v.prixVenteHt || 0) + (v.tmaTotalHt || 0), 0);

  const rows = marches.map((m) => {
    const dpgfTotal = m.dpgf.reduce((s, l) => s + (l.totalHt || 0), 0);
    const validated = m.dpgf.reduce((s, l) => s + (l.validatedHt || 0), 0);
    const deltaAvenants = deltasByMarche.get(m.id) || 0;
    const revised = dpgfTotal + deltaAvenants;
    const remaining = Math.max(0, revised - validated);
    const pct = revised > 0 ? validated / revised : 0;
    return {
      marcheId: m.id,
      entreprise: m.entreprise?.name || "-",
      reference: m.reference || "-",
      initialHt: m.montantInitialHt || 0,
      dpgfTotalHt: dpgfTotal,
      deltaAvenants,
      revisedHt: revised,
      validatedHt: validated,
      remainingHt: remaining,
      progress: pct,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.initial += r.initialHt;
      acc.dpgf += r.dpgfTotalHt;
      acc.delta += r.deltaAvenants;
      acc.revised += r.revisedHt;
      acc.validated += r.validatedHt;
      acc.remaining += r.remainingHt;
      return acc;
    },
    { initial: 0, dpgf: 0, delta: 0, revised: 0, validated: 0, remaining: 0 }
  );

  const progressGlobal = totals.revised > 0 ? totals.validated / totals.revised : 0;
  const marge = ventesHt - totals.revised;

  return NextResponse.json({
    projectId: pid,
    totals: {
      initialHt: totals.initial,
      dpgfTotalHt: totals.dpgf,
      deltaAvenants: totals.delta,
      revisedHt: totals.revised,         // coûts révisés
      validatedHt: totals.validated,
      remainingHt: totals.remaining,
      progress: progressGlobal,
      ventesHt,                          // recettes
      marge                              // ventes - coûts révisés
    },
    marches: rows,
  });
}
