import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Synthèse globale sur tous les projets: DPGF total, validé, restant, factures validées.
export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      markets: {
        include: {
          dpgf: true,
          factures: { include: { lignes: true } },
          entreprise: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const rows = projects.map((p) => {
    let dpTotal = 0, dpValid = 0, factVal = 0;
    for (const m of p.markets) {
      for (const l of m.dpgf) {
        dpTotal += l.totalHt || 0;
        dpValid += l.validatedHt || 0;
      }
      for (const f of m.factures) {
        for (const fl of f.lignes) {
          factVal += fl.validatedHt || 0;
        }
      }
    }
    return {
      projectId: p.id,
      projectName: p.name,
      dpTotal,
      dpValid,
      dpRest: Math.max(0, dpTotal - dpValid),
      factVal,
      markets: p.markets.length,
    };
  });

  const totals = rows.reduce((a, r) => {
    a.dpTotal += r.dpTotal;
    a.dpValid += r.dpValid;
    a.dpRest += r.dpRest;
    a.factVal += r.factVal;
    a.projects += 1;
    a.markets += r.markets;
    return a;
  }, { dpTotal: 0, dpValid: 0, dpRest: 0, factVal: 0, projects: 0, markets: 0 });

  return NextResponse.json({ rows, totals });
}
