import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const marcheId = parseInt(url.searchParams.get("marcheId") || "1", 10);
  const validate = url.searchParams.get("validate") === "1";

  const marche = await prisma.marche.findUnique({
    where: { id: marcheId },
    include: { project: true, entreprise: true, dpgf: true },
  });
  if (!marche) return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });

  const f = await prisma.facture.create({
    data: {
      projectId: marche.projectId,
      entrepriseId: marche.entrepriseId,
      marcheId: marche.id,
      numero: `F-${Date.now()}`,
      lignes: {
        create: (marche.dpgf || []).slice(0, 2).map((l) => ({
          dpgfLineId: l.id,
          requestedHt: Math.min(l.totalHt, 1500),
          validatedHt: validate ? Math.min(l.totalHt, 1500) : 0,
        })),
      },
    },
  });
  return NextResponse.json({ id: f.id, numero: f.numero });
}
