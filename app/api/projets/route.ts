import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  const projets = await prisma.project.findMany({
    include: {
      markets: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projets);
}
