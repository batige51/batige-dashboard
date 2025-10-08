import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.facture.findMany({
    orderBy: { id: "desc" },
    take: 20,
    select: { id: true, numero: true, date: true, statut: true }
  });
  return NextResponse.json(items);
}
