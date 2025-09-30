import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** GET /api/marches/[id]/budget  (id = marché) */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mid = parseInt(id, 10);
  if (isNaN(mid)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const m = await prisma.marche.findUnique({
    where: { id: mid },
    include: {
      dpgf: true,
      AvenantEntreprise: { include: { lines: true } },
      project: true,
      entreprise: true,
    },
  });
  if (!m) return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });

  const initial = m.montantInitialHt || 0;
  const avenants = (m.AvenantEntreprise || []).reduce((s, av) => (
    s + (av.lines || []).reduce((ss, l) => ss + (l.deltaHt || 0), 0)
  ), 0);
  const courant = initial + avenants;

  const dpgf = (m.dpgf || []).map((d) => {
    const total = d.totalHt || 0;
    const cumul = d.validatedHt || 0;
    const restant = Math.max(0, total - cumul);
    return {
      id: d.id, code: d.code, description: d.description,
      totalHt: total, validatedHt: cumul, remainingHt: restant
    };
  });

  const totals = dpgf.reduce((a, r) => {
    a.total += r.totalHt; a.cumul += r.validatedHt; a.restant += r.remainingHt; return a;
  }, { total: 0, cumul: 0, restant: 0 });

  return NextResponse.json({
    marche: { id: m.id, reference: m.reference },
    project: { id: m.project.id, name: m.project.name },
    entreprise: { id: m.entreprise.id, name: m.entreprise.name },
    initial, avenants, courant,
    dpgf, totals
  });
}

