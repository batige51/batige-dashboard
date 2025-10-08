import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** POST /api/devis/deduction
 * body: {
 *   fromMarcheId: number,  // entreprise DÉDUITE (−Δ)
 *   toMarcheId: number,    // entreprise qui a FAIT le travail (+Δ)
 *   numero?: string|null,
 *   description: string,
 *   amount: number         // positif
 * }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(()=> ({}));
  const fromMarcheId = Number(body?.fromMarcheId);
  const toMarcheId   = Number(body?.toMarcheId);
  const description  = String(body?.description ?? "");
  const numero       = body?.numero ? String(body.numero) : null;
  const amount       = Math.abs(Number(body?.amount ?? 0));

  if (!fromMarcheId || !toMarcheId || !amount || !description) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // helper: crée un avenant LIBRE (+/- amount)
  async function createLibre(marcheId: number, delta: number) {
    // on crée un poste DPGF technique "Avenants" si nécessaire
    const dpgf = await prisma.dpgfLine.create({
      data: {
        marcheId,
        code: "AV-LIBRE",
        description,
        lot: "Avenants",
        unitPriceHt: delta,  // sera réajusté par ligne d'avenant (deltaHt)
        totalHt: 0,
      },
    });
    const avenant = await prisma.avenantEntreprise.create({
      data: {
        marcheId,
        numero: numero ?? `AV-${Date.now()}`,
        lines: {
          create: [{ dpgfLineId: dpgf.id, deltaHt: delta }],
        },
      },
      include: { lines: true },
    });
    return avenant;
  }

  const plus = await createLibre(toMarcheId, +amount);
  const moins = await createLibre(fromMarcheId, -amount);

  return NextResponse.json({ plus, moins }, { status: 201 });
}
