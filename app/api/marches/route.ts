import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const b = await req.json().catch(()=>null);
  const { projectId, entrepriseName, reference, montantInitialHt } = b || {};
  if (!projectId || !entrepriseName || !reference) {
    return NextResponse.json({ error: "projectId, entrepriseName, reference requis" }, { status: 400 });
  }
  const ent = await prisma.entreprise.upsert({
    where: { name: String(entrepriseName).trim() },
    update: {},
    create: { name: String(entrepriseName).trim() }
  });

  const m = await prisma.marche.create({
    data: {
      projectId: Number(projectId),
      entrepriseId: ent.id,
      reference: String(reference),
      montantInitialHt: Number(montantInitialHt || 0),
    }
  });

  return NextResponse.json(m, { status: 201 });
}
