import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // ✅ on importe uniquement le namespace de types
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Query params acceptés:
 * - projectId: number
 * - entrepriseId: number
 * - statut: "EN_ATTENTE" | "VALIDEE" | "REFUSEE"
 * - dateMin, dateMax: yyyy-mm-dd
 * - amountMin, amountMax: number (HT sur la facture: somme validatedHt || requestedHt)
 * - q: string (search sur facture.numero + lignes.dpgfLine?. description/code)
 * - limit, offset: pagination simple (par défaut 100 / 0)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = parseInt(url.searchParams.get("projectId") || "", 10);
  const entrepriseId = parseInt(url.searchParams.get("entrepriseId") || "", 10);
  const statut = url.searchParams.get("statut") as any;
  const dateMin = url.searchParams.get("dateMin");
  const dateMax = url.searchParams.get("dateMax");
  const amountMin = parseFloat(url.searchParams.get("amountMin") || "");
  const amountMax = parseFloat(url.searchParams.get("amountMax") || "");
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 500);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10) || 0;

  // Filtrage “where” primaire
  const where: Prisma.FactureWhereInput = {};

  if (!isNaN(projectId)) where.projectId = projectId;
  if (!isNaN(entrepriseId)) where.entrepriseId = entrepriseId;
  if (statut === "EN_ATTENTE" || statut === "VALIDEE" || statut === "REFUSEE") where.statut = statut;

  if (dateMin || dateMax) {
    where.date = {};
    if (dateMin) (where.date as any).gte = new Date(dateMin);
    if (dateMax) (where.date as any).lte = new Date(dateMax + "T23:59:59");
  }

  // On récupère les factures + lignes pour post-filtrer sur le montant et la recherche texte
  const rows = await prisma.facture.findMany({
    where,
    include: {
      project: true,
      entreprise: true,
      marche: true,
      lignes: { include: { dpgfLine: true } },
    },
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });

  // Calcul montant + filtre montant / texte
  const filtered = rows.filter((f) => {
    const totalHT = (f.lignes || []).reduce((s, l) => s + (l.validatedHt ?? l.requestedHt ?? 0), 0);

    if (!isNaN(amountMin) && totalHT < amountMin) return false;
    if (!isNaN(amountMax) && totalHT > amountMax) return false;

    if (q) {
      const hay = [
        f.numero || "",
        ...(f.lignes || []).map(l => l.dpgfLine?.code || ""),
        ...(f.lignes || []).map(l => l.dpgfLine?.description || ""),
      ].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  // Map minimal pour le tableau
  const result = filtered.map((f) => {
    const totalHT = (f.lignes || []).reduce((s, l) => s + (l.validatedHt ?? l.requestedHt ?? 0), 0);
    return {
      id: f.id,
      numero: f.numero,
      date: f.date,
      statut: f.statut,
      project: f.project?.name || "",
      entreprise: f.entreprise?.name || "",
      marche: f.marche?.reference || "",
      totalHT,
      tvaRate: f.tvaRate,
      retenuePct: f.retenuePct,
      isDgd: f.isDgd,
    };
  });

  return NextResponse.json({
    count: result.length,
    items: result,
    offset,
    limit,
  });
}
