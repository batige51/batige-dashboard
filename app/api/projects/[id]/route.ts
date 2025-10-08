import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  const projectId = Number(params.id);

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { markets: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("Erreur GET /projects/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
