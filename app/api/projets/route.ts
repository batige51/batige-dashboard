import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const projets = await prisma.project.findMany({
    include: {
      markets: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projets);
}
