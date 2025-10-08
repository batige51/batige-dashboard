import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ projectId: string }>}) {
  const { projectId } = await ctx.params;
  const pid = parseInt(projectId, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });

  const lots = await prisma.lot.findMany({
    where: { projectId: pid },
    orderBy: { id: "asc" }
  });
  return NextResponse.json(lots);
}
