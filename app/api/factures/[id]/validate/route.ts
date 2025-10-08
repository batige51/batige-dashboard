import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";


export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fid = Number(id);
  
  if (!Number.isFinite(fid)) {
    return NextResponse.json({ error: "ID facture invalide" }, { status: 400 });
  }

  const facture = await prisma.facture.findUnique({
    where: { id: fid },
    include: {
      marche: true,
      lignes: {
        include: {
          dpgfLine: true,
        },
      },
    },
  });

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Vérifier si la facture est déjà validée
  if (facture.statut === "VALIDEE") {
    return NextResponse.json({ error: "Facture déjà validée" }, { status: 400 });
  }

  // Vérifications métier
  for (const l of facture.lignes) {
    if (!l.dpgfLine) {
      return NextResponse.json({ error: `DPGF manquante pour la ligne ${l.id}` }, { status: 400 });
    }

    const d = l.dpgfLine;
    const otherValidatedCumul = (d.validatedHt || 0) - (l.validatedHt || 0);
    const newValidatedCumul = otherValidatedCumul + (l.validatedHt || 0);

    if (newValidatedCumul > d.totalHt) {
      return NextResponse.json({
        error: `Ligne DPGF ${d.code} : cumul validé dépasserait le total (${newValidatedCumul} > ${d.totalHt})`,
      }, { status: 400 });
    }
  }

  // Validation
  await prisma.facture.update({
    where: { id: fid },
    data: { statut: "VALIDEE" },
  });

  // Mise à jour des cumuls DPGF
  for (const l of facture.lignes) {
    if (l.dpgfLine) {
      const d = l.dpgfLine;
      const otherValidatedCumul = (d.validatedHt || 0) - (l.validatedHt || 0);
      const newValidatedCumul = otherValidatedCumul + (l.validatedHt || 0);

      await prisma.dpgfLine.update({
        where: { id: d.id },
        data: { validatedHt: newValidatedCumul },
      });
    }
  }

  return NextResponse.json({ success: true });
}
