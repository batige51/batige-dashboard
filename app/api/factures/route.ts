import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const items = await prisma.facture.findMany({
    orderBy: { id: "desc" },
    take: 20,
    select: { id: true, numero: true, date: true, statut: true }
  });
  return NextResponse.json(items);
}
