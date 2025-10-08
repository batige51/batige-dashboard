import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

/**
 * GET /api/projects
 * -> renvoie la liste des projets en JSON
 */
export async function GET() {
  try {
    const items = await prisma.project.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * body: { name: string }
 * -> crée un projet et renvoie { item: projetCréé } en JSON
 *    (c’est ce qui corrige ton erreur “Unexpected end of JSON input”)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Nom de projet requis" }, { status: 400 });
    }

    const created = await prisma.project.create({
      data: { name: body.name.trim() },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
