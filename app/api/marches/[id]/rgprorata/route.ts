import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


// GET /api/marches/:id/rgprorata
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const marcheId = Number(id);
  if (!marcheId) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  const m = await prisma.marche.findUnique({
    where: { id: marcheId },
    select: { id: true, rgPct: true, prorataPct: true },
  });

  if (!m) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  return NextResponse.json({
    item: { id: m.id, rgPct: Number(m.rgPct ?? 0), prorataPct: Number(m.prorataPct ?? 0) },
  });
}

// PUT /api/marches/:id/rgprorata
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const marcheId = Number(id);
  if (!marcheId) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const rgPct = Math.max(0, Number(body?.rgPct ?? 0));
  const prorataPct = Math.max(0, Number(body?.prorataPct ?? 0));

  const m = await prisma.marche.update({
    where: { id: marcheId },
    data: { rgPct, prorataPct },
    select: { id: true, rgPct: true, prorataPct: true },
  });

  return NextResponse.json({
    item: { id: m.id, rgPct: Number(m.rgPct ?? 0), prorataPct: Number(m.prorataPct ?? 0) },
  });
}

