import { NextResponse } from "next/server";
import { PrismaClient, AvenantStatut } from "@prisma/client";
const prisma = new PrismaClient();

/** POST /api/avenants  body: { marcheId, numero, date?, statut?, lines:[{ dpgfLineId, deltaHt }] } */
export async function POST(req: Request) {
  const b = await req.json();
  const marcheId = parseInt(b.marcheId, 10);
  if (isNaN(marcheId)) return NextResponse.json({ error: "marcheId invalide" }, { status: 400 });

  const data: any = {
    marcheId,
    numero: String(b.numero || "").trim() || "AV-??",
    statut: b.statut && AvenantStatut[b.statut as keyof typeof AvenantStatut] ? b.statut : "BROUILLON",
    date: b.date ? new Date(b.date) : new Date(),
  };

  const lines = Array.isArray(b.lines) ? b.lines.map((l:any)=>({
    dpgfLineId: Number(l.dpgfLineId),
    deltaHt: Number(l.deltaHt||0),
  })) : [];

  const created = await prisma.avenantEntreprise.create({
    data: {
      ...data,
      lines: lines.length ? { createMany: { data: lines } } : undefined,
    },
    include: { lines: true },
  });
  return NextResponse.json(created, { status: 201 });
}
