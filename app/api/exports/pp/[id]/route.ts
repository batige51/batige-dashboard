import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { toCsv } from "@/app/lib/csv";

const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pid = parseInt(id, 10);
  if (isNaN(pid)) return NextResponse.json({ error: "ID PP invalide" }, { status: 400 });

  const pp = await prisma.propositionPaiement.findUnique({
    where: { id: pid },
    include: {
      facture: { include: { project: true, marche: true, entreprise: true } },
      lines: { include: { dpgfLine: true }, orderBy: { id: "asc" } },
    },
  });
  if (!pp) return NextResponse.json({ error: "PP introuvable" }, { status: 404 });

  const header = [
    ["PP", pp.numero ?? `PP-${pp.id}`],
    ["Créée le", new Date(pp.createdAt).toLocaleDateString("fr-FR")],
    ["Facture", pp.facture?.numero ?? ""],
    ["Projet", pp.facture?.project?.name ?? ""],
    ["Marché", pp.facture?.marche?.reference ?? ""],
    ["Entreprise", pp.facture?.entreprise?.name ?? ""],
    [],
  ];

  const rows = (pp.lines || []).map((l) => {
    const d = l.dpgfLine;
    return [
      d?.id ?? "",
      d?.code ?? "",
      d?.description ?? "",
      d?.totalHt ?? 0,
      l.previousHt ?? 0,
      l.currentHt ?? 0,
      l.remainingHt ?? 0,
    ];
  });

  const total = rows.reduce(
    (a, r) => {
      a.total += Number(r[3]) || 0;
      a.previous += Number(r[4]) || 0;
      a.current += Number(r[5]) || 0;
      a.remaining += Number(r[6]) || 0;
      return a;
    },
    { total: 0, previous: 0, current: 0, remaining: 0 }
  );

  const table = [
    ["dpgf_id", "code", "description", "montant_total_ht", "precedent_ht", "courant_ht", "restant_ht"],
    ...rows,
    [],
    ["", "", "TOTAUX", total.total, total.previous, total.current, total.remaining],
  ];

  const csv = toCsv([...header, ...table]);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="pp_${pid}.csv"`,
      "cache-control": "no-store",
    },
  });
}

