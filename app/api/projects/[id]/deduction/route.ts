import prisma from "@/lib/prisma";
import { AvenantStatut } from "@prisma/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/projects/:projectId/deduction
 * body: {
 *   fromMarcheId: number,
 *   toMarcheId: number,
 *   numero?: string,
 *   description: string,
 *   montantHt: number
 * }
 */
export async function POST(req: Request, context: any) {
  const { id } = context.params;
  const pid = Number(id);

  try {
    const body = await req.json().catch(() => ({}));
    const fromMarcheId = Number(body?.fromMarcheId);
    const toMarcheId = Number(body?.toMarcheId);
    const numero = (body?.numero ?? "").toString().trim();
    const description = (body?.description ?? "").toString().trim();
    const montantHt = Number(body?.montantHt);

    if (!pid || !fromMarcheId || !toMarcheId || !description || !montantHt || isNaN(montantHt)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const [fromMarche, toMarche] = await Promise.all([
      prisma.marche.findUnique({ where: { id: fromMarcheId }, select: { id: true, projectId: true } }),
      prisma.marche.findUnique({ where: { id: toMarcheId }, select: { id: true, projectId: true } }),
    ]);

    if (!fromMarche || !toMarche || fromMarche.projectId !== pid || toMarche.projectId !== pid) {
      return NextResponse.json({ error: "Marchés non trouvés dans ce projet" }, { status: 404 });
    }

    // helper : ligne DPGF “Avenant libre”
    async function ensureAvenantDpgf(marcheId: number) {
      const exist = await prisma.dpgfLine.findFirst({
        where: { marcheId, lot: "Avenants", description: "Avenant libre" },
        select: { id: true },
      });
      if (exist) return exist.id;

      const created = await prisma.dpgfLine.create({
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
      return created.id;
    }

    // on crée les 2 avenants
    const [dpgfFromId, dpgfToId] = await Promise.all([
      ensureAvenantDpgf(fromMarcheId),
      ensureAvenantDpgf(toMarcheId),
    ]);

    const nowNumero = numero || `DED-${Date.now()}`;

    const [avPlus, avMoins] = await prisma.$transaction([
      prisma.avenantEntreprise.create({
        data: {
          marcheId: fromMarcheId,
          numero: nowNumero,
          statut: AvenantStatut.BROUILLON,
          lines: {
            create: [{ dpgfLineId: dpgfFromId, deltaHt: Math.abs(montantHt) }],
          },
        },
        include: { lines: true },
      }),
      prisma.avenantEntreprise.create({
        data: {
          marcheId: toMarcheId,
          numero: nowNumero,
          statut: AvenantStatut.BROUILLON,
          lines: {
            create: [{ dpgfLineId: dpgfToId, deltaHt: -Math.abs(montantHt) }],
          },
        },
        include: { lines: true },
      }),
    ]);

    return NextResponse.json({ plus: avPlus, moins: avMoins }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur déduction" }, { status: 500 });
  }
}
