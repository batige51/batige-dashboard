import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/avenants/:id
 */
export async function GET(_req: NextRequest, context: unknown) {
  const { params } = context as { params: { id: string } };
  const avenantId = Number(params.id);

  try {
    const avenant = await prisma.avenantEntreprise.findUnique({
      where: { id: avenantId },
      include: { lines: true, marche: true },
    });

    if (!avenant) {
      return NextResponse.json({ error: "Avenant introuvable" }, { status: 404 });
    }

    return NextResponse.json({ avenant });
  } catch (e: any) {
    console.error("Erreur GET /avenants/[id]:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
