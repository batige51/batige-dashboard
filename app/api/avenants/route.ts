import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalide" }, { status: 400 });

  const { marcheId, numero, date, lines } = body || {};
  if (!marcheId || !numero || !Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "marcheId, numero et lines requis" }, { status: 400 });
  }

  const avenant = await prisma.avenantEntreprise.create({
    data: {
      marcheId: Number(marcheId),
      numero: String(numero),
      date: date ? new Date(date) : undefined,
      lines: {
        create: lines.map((l: any) => ({
          dpgfLineId: Number(l.dpgfLineId),
          deltaHt: Number(l.deltaHt || 0),
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json(avenant, { status: 201 });
}
