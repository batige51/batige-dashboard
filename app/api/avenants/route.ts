import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/avenants?marcheId=123
 * POST /api/avenants  { marcheId, numero? }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marcheId = Number(searchParams.get("marcheId"));
  if (!marcheId) return NextResponse.json({ error: "marcheId requis" }, { status: 400 });

  const avenants = await prisma.avenantEntreprise.findMany({
    where: { marcheId },
    include: { lines: { include: { dpgfLine: true } } },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({ items: avenants });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const marcheId = Number(body.marcheId);
  const numero = body.numero ?? null;

  if (!marcheId) return NextResponse.json({ error: "marcheId requis" }, { status: 400 });

  const created = await prisma.avenantEntreprise.create({
    data: { marcheId, numero: numero ?? `AV-${Date.now()}` },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
