import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, entrepriseName, reference, montantInitialHt } = body;

  if (!projectId || !entrepriseName) {
    return NextResponse.json({ error: "projectId et entrepriseName requis" }, { status: 400 });
  }

  // Chercher ou créer l'entreprise
  let ent = await prisma.entreprise.findFirst({
    where: { name: String(entrepriseName).trim() }
  });

  if (!ent) {
    ent = await prisma.entreprise.create({
      data: { name: String(entrepriseName).trim() }
    });
  }

  const marche = await prisma.marche.create({
    data: {
      projectId: Number(projectId),
      entrepriseId: ent.id,
      reference: reference || null,
      montantInitialHt: Number(montantInitialHt) || 0,
    },
  });

  return NextResponse.json(marche);
}
