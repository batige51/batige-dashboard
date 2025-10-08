import prisma from "@/lib/prisma";
import { AvenantStatut } from "@prisma/client"; // ✅ ajout essentiel
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


/**
 * POST /api/marches/:id/avenant-libre
 * body: { numero?: string, description: string, montantHt: number } // + pour avenant, - pour remise
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const marcheId = Number(id);

  try {
    if (!marcheId) return NextResponse.json({ error: "id manquant" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const numero = (body?.numero ?? "").toString().trim() || `AV-${Date.now()}`;
    const description = (body?.description ?? "").toString().trim();
    const montantHt = Number(body?.montantHt);

    if (!description || !montantHt || isNaN(montantHt)) {
      return NextResponse.json({ error: "description/montantHt invalides" }, { status: 400 });
    }

    // Trouve ou crée la DpgfLine “Avenant libre”
    let dpgf = await prisma.dpgfLine.findFirst({
      where: { marcheId, lot: "Avenants", description: "Avenant libre" },
      select: { id: true },
    });
    if (!dpgf) {
      dpgf = await prisma.dpgfLine.create({
        data: {
          marcheId,
          code: null,
          description: "Avenant libre",
          unite: null,
          qty: 1,
          unitPriceHt: 0,
          totalHt: 0,
          validatedHt: 0,
          lot: "Avenants",
          idx: 999999,
        },
        select: { id: true },
      });
    }

    const avenant = await prisma.avenantEntreprise.create({
      data: {
        marcheId,
        numero,
        statut: AvenantStatut.BROUILLON,
        lines: {
          create: [
            { dpgfLineId: dpgf.id, deltaHt: montantHt },
          ],
        },
      },
      include: { lines: true },
    });

    return NextResponse.json({ item: avenant }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur avenant-libre" }, { status: 500 });
  }
}

