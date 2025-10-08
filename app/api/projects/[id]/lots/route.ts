import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";

// Liste les lots d'un projet
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pid = parseInt(id, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });

  const lots = await prisma.lot.findMany({
    where: { projectId: pid },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(lots);
}

// Crée un lot pour ce projet
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pid = parseInt(id, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });

  const body = await req.json().catch(()=>null) as {
    numero: string;
    typologie?: string;
    surface?: number;
    prixCatalogueHt?: number;
  } | null;

  if (!body || !body.numero) {
    return NextResponse.json({ error: "numero requis" }, { status: 400 });
  }

  const lot = await prisma.lot.create({
    data: {
      projectId: pid,
      numero: body.numero,
      typologie: body.typologie || null,
      surface: body.surface ?? null,
      prixCatalogueHt: body.prixCatalogueHt ?? 0,
    },
  });

  return NextResponse.json(lot, { status: 201 });
}
