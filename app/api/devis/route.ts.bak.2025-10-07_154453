import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = Number(searchParams.get("projectId") || "");
    const entrepriseId = Number(searchParams.get("entrepriseId") || "");
    const q = (searchParams.get("q") || "").trim();

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (entrepriseId) where.entrepriseId = entrepriseId;

    const marches = await prisma.marche.findMany({
      where,
      include: {
        project: true,
        entreprise: true,
        dpgf: { select: { lot: true, totalHt: true } },
        AvenantEntreprise: { include: { lines: true } },
      },
      orderBy: { id: "desc" },
    });

    const filtered = q
      ? marches.filter((m) =>
          `${m.reference ?? ""} ${m.project?.name ?? ""} ${m.entreprise?.name ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase())
        )
      : marches;

    const items = filtered.map((m) => {
      const lots = Array.from(new Set(m.dpgf.map((l) => l.lot).filter(Boolean) as string[]));
      const montantHt = m.dpgf.reduce((s, l) => s + (l.totalHt ?? 0), 0);
      const avenantsHt = m.AvenantEntreprise.flatMap((a) => a.lines).reduce(
        (s, l) => s + (l.deltaHt ?? 0),
        0
      );
      const totalApresRemise = montantHt + (m.remiseHt || 0);

      return {
        id: m.id,
        reference: m.reference,
        project: m.project ? { id: m.project.id, name: m.project.name } : null,
        entreprise: m.entreprise ? { id: m.entreprise.id, name: m.entreprise.name } : null,
        lots,
        montantHt,
        avenantsHt,
        remiseHt: m.remiseHt || 0,
        totalApresRemise,
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
