import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextResponse } from "next/server";


// Détecte le séparateur et split chaque ligne
function parseCsv(text: string) {
  // enlève BOM éventuel
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const sep = text.includes("\t") ? "\t" : ";";
  return lines.map((l) => l.split(sep));
}

// Convertit "1 234,56 €" -> 1234.56
function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  const s = String(v)
    .replace(/\u00A0/g, " ") // NBSP → espace
    .replace(/[€]/g, "")
    .replace(/\s+/g, "") // supprime espaces
    .replace(/,/g, "."); // virgule → point
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Ligne d'entête ?
function looksLikeHeader(cols: string[]): boolean {
  const j = cols.map((c) => c.toLowerCase()).join("|");
  return (
    j.includes("designation") ||
    j.includes("description") ||
    j.includes("unité") ||
    j.includes("unite")
  );
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const projectId = Number(form.get("projectId"));
    const lotDefault = String(form.get("lot") || "");
    const entrepriseName = String(form.get("entrepriseName") || "").trim();
    const file = form.get("file") as File | null;

    if (!projectId || !entrepriseName || !file) {
      return NextResponse.json(
        { error: "projectId, entrepriseName et file sont requis" },
        { status: 400 }
      );
    }

    // Lecture du fichier
    const buf = Buffer.from(await file.arrayBuffer());
    let text = buf.toString("utf8");
    // Heuristique recodage latin1 si caractères cassés
    if (text.includes("Ã") || text.includes("Â")) {
      text = Buffer.from(buf).toString("latin1");
    }

    const rows = parseCsv(text);
    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV vide" }, { status: 400 });
    }

    // Entreprise: trouve ou crée par nom
    let entreprise = await prisma.entreprise.findFirst({
      where: { name: entrepriseName },
    });
    if (!entreprise) {
      entreprise = await prisma.entreprise.create({
        data: { name: entrepriseName },
      });
    }

    // Crée le "devis" (marche)
    const reference = file.name?.replace(/\.(csv|CSV)$/, "") || null;
    const marche = await prisma.marche.create({
      data: {
        projectId,
        entrepriseId: entreprise.id,
        reference,
        montantInitialHt: 0,
      },
    });

    // Détermine le point de départ (saute entête)
    let start = 0;
    if (rows.length && looksLikeHeader(rows[0])) start = 1;

    let dpgfTotal = 0;

    for (let i = start; i < rows.length; i++) {
      const cols = rows[i].map((c) => (c ?? "").toString().trim());
      if (cols.length < 2) continue; // au moins code + description

      const code = cols[0] || null;
      const description = cols[1] || "";
      const unite = cols[2] || null;

      const qty = cols[3] !== undefined ? toNum(cols[3]) : 0;
      const unitPriceHt = cols[4] !== undefined ? toNum(cols[4]) : 0;

      const totalHt =
        cols[5] !== undefined && cols[5] !== ""
          ? toNum(cols[5])
          : +(qty * unitPriceHt).toFixed(2);

      const lotFromCsv =
        (cols[6] && cols[6].trim()) || (lotDefault && lotDefault.trim()) || null;

      dpgfTotal += totalHt;

      await prisma.dpgfLine.create({
        data: {
          marcheId: marche.id, // ✅ on réfère par l’ID
          code,
          description,
          unite,
          qty,
          unitPriceHt,
          totalHt,
          lot: lotFromCsv,
        },
      });
    }

    // Met à jour le montant initial
    await prisma.marche.update({
      where: { id: marche.id },
      data: { montantInitialHt: dpgfTotal },
    });

    return NextResponse.json(
      { ok: true, marcheId: marche.id, totalHt: dpgfTotal },
      { status: 201 }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
