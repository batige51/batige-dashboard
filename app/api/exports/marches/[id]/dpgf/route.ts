import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Export JSON de la DPGF d'un marché
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const mid = Number(id);
  if (!Number.isFinite(mid)) {
    return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });
  }

  const marche = await prisma.marche.findUnique({
    where: { id: mid },
    include: {
      project: true,
      entreprise: true,
      dpgf: true, // relation sur Marche = "dpgf"
    },
  });

  if (!marche) {
    return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });
  }

  const dpgf = (marche.dpgf || []).map((l) => ({
    id: l.id,
    code: l.code ?? "",
    description: l.description ?? "",
    unite: l.unite ?? "",
    quantite: l.qty ?? 0,
    pu_ht: l.unitPriceHt ?? 0,
    total_ht: l.totalHt ?? 0,
    valide_cumul_ht: l.validatedHt ?? 0,
    lot: l.lot ?? "",
    idx: l.idx ?? null,
  }));

  return NextResponse.json({
    marche: {
      id: marche.id,
      reference: marche.reference,
      montantInitialHt: marche.montantInitialHt,
      project: { id: marche.project.id, name: marche.project.name },
      entreprise: { id: marche.entreprise.id, name: marche.entreprise.name },
    },
    dpgf,
  });
}
