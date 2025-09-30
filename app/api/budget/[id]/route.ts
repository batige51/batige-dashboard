import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET /api/budget/[id] (id = project)
 * Retourne totaux par projet et détail par marché
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pid = parseInt(id, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id: pid },
    include: {
      markets: {
        include: {
          dpgf: true,
          AvenantEntreprise: { include: { lines: true } },
        },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  const marches = project.markets.map((m) => {
    const totalInitial = m.montantInitialHt || 0;
    const avenantDelta = (m.AvenantEntreprise || []).reduce((s, av) => {
      return s + (av.lines || []).reduce((ss, l) => ss + (l.deltaHt || 0), 0);
    }, 0);
    const budgetCourant = totalInitial + avenantDelta;
    const valideCumul = (m.dpgf || []).reduce((s, d) => s + (d.validatedHt || 0), 0);
    const restant = Math.max(0, budgetCourant - valideCumul);
    return {
      id: m.id,
      reference: m.reference,
      totalInitial,
      avenantDelta,
      budgetCourant,
      valideCumul,
      restant,
    };
  });

  const totaux = marches.reduce(
    (a, r) => {
      a.initial += r.totalInitial;
      a.avenants += r.avenantDelta;
      a.courant += r.budgetCourant;
      a.valide += r.valideCumul;
      a.restant += r.restant;
      return a;
    },
    { initial: 0, avenants: 0, courant: 0, valide: 0, restant: 0 }
  );

  return NextResponse.json({ project: { id: project.id, name: project.name }, marches, totaux });
}
