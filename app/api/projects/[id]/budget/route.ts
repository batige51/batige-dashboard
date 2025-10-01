import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Agrégations budget d'un projet : totaux DPGF, validé, restant, par marché & entreprise.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pid = parseInt(id, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });

  // Récupérer marchés + DPGF + factures du projet
  const marches = await prisma.marche.findMany({
    where: { projectId: pid },
    include: {
      entreprise: true,
      dpgf: true,
      factures: {
        include: { lignes: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  // Construire lignes marché
  const rows = marches.map((m) => {
    const totalDPGF = (m.dpgf || []).reduce((s, l) => s + (l.totalHt || 0), 0);
    const validatedCumul = (m.dpgf || []).reduce((s, l) => s + (l.validatedHt || 0), 0);
    const remaining = Math.max(0, totalDPGF - validatedCumul);

    // Sommes facture (demandé/validé) sur lignes
    let factureDemande = 0;
    let factureValide = 0;
    for (const f of m.factures) {
      for (const fl of f.lignes) {
        factureDemande += fl.requestedHt || 0;
        factureValide += fl.validatedHt || 0;
      }
    }

    return {
      marcheId: m.id,
      marcheRef: m.reference || `MAR-${m.id}`,
      entreprise: m.entreprise?.name || "-",
      totalDPGF,
      validatedCumul,
      remaining,
      factureDemande,
      factureValide,
    };
  });

  const totals = rows.reduce(
    (a, r) => {
      a.totalDPGF += r.totalDPGF;
      a.validatedCumul += r.validatedCumul;
      a.remaining += r.remaining;
      a.factureDemande += r.factureDemande;
      a.factureValide += r.factureValide;
      return a;
    },
    { totalDPGF: 0, validatedCumul: 0, remaining: 0, factureDemande: 0, factureValide: 0 }
  );

  return NextResponse.json({ projectId: pid, rows, totals });
}
