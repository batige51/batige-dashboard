import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mid = parseInt(id, 10);
  if (isNaN(mid)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const list = await prisma.avenantEntreprise.findMany({
    where: { marcheId: mid },
    include: {
      lines: { include: { dpgfLine: true }, orderBy: { id: "asc" } },
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json(list);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mid = parseInt(id, 10);
  if (isNaN(mid)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const body = await req.json().catch(()=>null) as {
    numero: string;
    statut?: "BROUILLON" | "VALIDE";
    lines: Array<{ dpgfLineId: number; deltaHt: number }>;
  } | null;
  if (!body || !body.numero || !Array.isArray(body.lines)) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  // Transaction : créer l’avenant + lignes et appliquer impact sur DPGF.totalHt
  const created = await prisma.$transaction(async (tx) => {
    const avenant = await tx.avenantEntreprise.create({
      data: {
        marcheId: mid,
        numero: body.numero,
        statut: body.statut || "BROUILLON",
      },
    });

    // créer lignes
    await tx.avenantLine.createMany({
      data: body.lines.map(l => ({ avenantId: avenant.id, dpgfLineId: l.dpgfLineId, deltaHt: l.deltaHt })),
    });

    // appliquer les deltas sur DPGF
    for (const l of body.lines) {
      const d = await tx.dpgfLine.findUnique({ where: { id: l.dpgfLineId } });
      if (!d) continue;
      const newTotal = (d.totalHt || 0) + (l.deltaHt || 0);
      await tx.dpgfLine.update({
        where: { id: l.dpgfLineId },
        data: { totalHt: newTotal < 0 ? 0 : newTotal },
      });
    }

    return avenant;
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
