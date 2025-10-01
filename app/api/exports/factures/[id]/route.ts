import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Export JSON d'une facture + ses lignes
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const facture = await prisma.facture.findUnique({
    where: { id: fid },
    include: {
      project: true,
      marche: true,
      entreprise: true,
      // ⚠️ Nom correct de la relation: dpgfLine (pas dpgf)
      lignes: { include: { dpgfLine: true }, orderBy: { id: "asc" } },
    },
  });

  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const payload = {
    facture: {
      id: facture.id,
      numero: facture.numero,
      date: facture.date,
      statut: facture.statut,
      tvaRate: facture.tvaRate,
      retenuePct: facture.retenuePct,
      isDgd: facture.isDgd,
    },
    project: { id: facture.project.id, name: facture.project.name },
    marche: { id: facture.marche.id, reference: facture.marche.reference },
    entreprise: { id: facture.entreprise.id, name: facture.entreprise.name },
    lignes: (facture.lignes || []).map((l) => ({
      id: l.id,
      dpgfLineId: l.dpgfLineId,
      code: l.dpgfLine?.code ?? null,
      description: l.dpgfLine?.description ?? null,
      unite: l.dpgfLine?.unite ?? null,
      qty: l.dpgfLine?.qty ?? null,
      unitPriceHt: l.dpgfLine?.unitPriceHt ?? null,
      totalHt: l.dpgfLine?.totalHt ?? null,
      requestedHt: l.requestedHt ?? 0,
      validatedHt: l.validatedHt ?? 0,
    })),
  };

  return NextResponse.json(payload);
}
