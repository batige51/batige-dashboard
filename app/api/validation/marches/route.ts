import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

/** GET /api/validation/marches?projectId=&q= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = Number(searchParams.get("projectId") || 0);
  const q = (searchParams.get("q") || "").toLowerCase().trim();

  const where: any = {};
  if (projectId) where.projectId = projectId;

  const marches = await prisma.marche.findMany({
    where,
    include: { project: true, entreprise: true, dpgf: { select: { totalHt: true } } },
    orderBy: { id: "desc" },
  });

  const mapped = marches.map((m) => ({
    id: m.id,
    label: `${m.project.name} — ${m.entreprise.name}${m.reference ? ` — ${m.reference}` : ""}`,
    totalHt: (m.dpgf || []).reduce((s, l) => s + (l.totalHt ?? 0), 0),
  }));

  const items = q ? mapped.filter((it) => it.label.toLowerCase().includes(q)) : mapped;
  return NextResponse.json({ items });
}
