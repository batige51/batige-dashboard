import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { toCsv } from "@/app/lib/csv";

const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return NextResponse.json({ error: "ID facture invalide" }, { status: 400 });

  const facture = await prisma.facture.findUnique({
    where: { id: fid },
    include: {
      project: true,
      marche: true,
      entreprise: true,
      lignes: { include: { dpgf: true }, orderBy: { id: "asc" } },
    },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const header = [
    ["Facture", facture.numero],
    ["Date", new Date(facture.date).toLocaleDateString("fr-FR")],
    ["Statut", facture.statut],
    ["Projet", facture.project?.name ?? ""],
    ["Marché", facture.marche?.reference ?? ""],
    ["Entreprise", facture.entreprise?.name ?? ""],
    ["TVA %", facture.tvaRate ?? 0],
    ["RG %", facture.retenuePct ?? 0],
    ["DGD", facture.isDgd ? "oui" : "non"],
    [],
  ];

  const body = [
    ["code", "description", "demande_ht", "valide_ht"],
    ...(facture.lignes || []).map((l) => [
      l.dpgf?.code ?? "",
      l.dpgf?.description ?? "",
      l.requestedHt ?? 0,
      l.validatedHt ?? 0,
    ]),
  ];

  const totalHT = (facture.lignes || []).reduce((s, l) => s + (l.validatedHt ?? l.requestedHt ?? 0), 0);
  const tva = totalHT * ((facture.tvaRate ?? 0) / 100);
  const ttc = totalHT + tva;
  const rgPct = facture.isDgd ? 0 : (facture.retenuePct ?? 0);
  const rg = totalHT * (rgPct / 100);
  const net = ttc - rg;

  const totals = [
    [],
    ["TOTAL_HT", totalHT],
    ["TVA", tva],
    ["TTC", ttc],
    ["RG", -rg],
    ["NET_A_PAYER", net],
  ];

  const csv = toCsv([...header, ...body, ...totals]);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="facture_${fid}.csv"`,
      "cache-control": "no-store",
    },
  });
}
