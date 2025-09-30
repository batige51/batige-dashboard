import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { toCsv } from "@/app/lib/csv";

const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mid = parseInt(id, 10);
  if (isNaN(mid)) return NextResponse.json({ error: "ID marché invalide" }, { status: 400 });

  const marche = await prisma.marche.findUnique({
    where: { id: mid },
    include: { dpgf: { orderBy: { id: "asc" } }, entreprise: true, project: true },
  });
  if (!marche) return NextResponse.json({ error: "Marché introuvable" }, { status: 404 });

  const header = [
    ["Projet", marche.project?.name ?? ""],
    ["Marché", marche.reference ?? `MAR-${marche.id}`],
    ["Entreprise", marche.entreprise?.name ?? ""],
    [],
  ];

  const table = [
    ["id", "code", "description", "unite", "quantite", "pu_ht", "total_ht", "valide_cumul_ht", "lot", "idx"],
    ...marche.dpgf.map((l) => [
      l.id,
      l.code ?? "",
      l.description ?? "",
      l.unite ?? "",
      l.qty ?? 0,
      l.unitPriceHt ?? 0,
      l.totalHt ?? 0,
      l.validatedHt ?? 0,
      l.lot ?? "",
      l.idx ?? "",
    ]),
  ];

  const csv = toCsv([...header, ...table]);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="dpgf_marche_${mid}.csv"`,
      "cache-control": "no-store",
    },
  });
}
