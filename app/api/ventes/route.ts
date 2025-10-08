import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

// Créer une vente actée pour un lot
export async function POST(req: Request) {
  const body = await req.json().catch(()=>null) as {
    lotId: number;
    client: string;
    prixVenteHt?: number; // si non fourni, on peut partir du prix catalogue
    tvaRate?: number;     // 0, 5.5, 20 etc.
  } | null;

  if (!body || !body.lotId || !body.client) {
    return NextResponse.json({ error: "lotId et client requis" }, { status: 400 });
  }

  const lot = await prisma.lot.findUnique({ where: { id: body.lotId } });
  if (!lot) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });

  const vente = await prisma.venteActee.create({
    data: {
      lotId: lot.id,
      client: body.client,
      prixVenteHt: body.prixVenteHt ?? (lot.prixCatalogueHt || 0),
      tvaRate: body.tvaRate ?? 20,
      tmaTotalHt: 0,
    },
  });

  return NextResponse.json(vente, { status: 201 });
}
