import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const runtime = "nodejs";


/**
 * POST /api/avenant-lines  { avenantId, dpgfLineId, deltaHt }
 * DELETE /api/avenant-lines?id=LINE_ID
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const avenantId = Number(body.avenantId);
  const dpgfLineId = Number(body.dpgfLineId);
  const deltaHt = Number(body.deltaHt);

  if (!avenantId || !dpgfLineId || isNaN(deltaHt)) {
    return NextResponse.json({ error: "avenantId, dpgfLineId, deltaHt requis" }, { status: 400 });
  }

  const line = await prisma.avenantLine.create({
    data: { avenantId, dpgfLineId, deltaHt },
    include: { dpgfLine: true },
  });

  return NextResponse.json({ item: line }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  await prisma.avenantLine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
