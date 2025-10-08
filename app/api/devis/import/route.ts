import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";


// Essaye tabulation puis point-virgule
function guessSplit(line: string) {
  if (line.includes("\t")) return "\t";
  if (line.includes(";")) return ";";
  return ",";
}

function toNumber(v: string | undefined) {
  if (!v) return 0;
  // Nettoyage formats FR ("1 234,56") ou "1234.56"
  const s = v.replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const projectId = Number(form.get("projectId"));
    const entrepriseId = Number(form.get("entrepriseId"));
    const lotLabel = String(form.get("lotLabel") ?? "Gros œuvre");

    if (!file || !projectId || !entrepriseId) {
      return NextResponse.json({ error: "file, projectId, entrepriseId requis" }, { status: 400 });
    }

    // Lecture brute
    const ab = await file.arrayBuffer();
    let text = Buffer.from(ab).toString("utf8");

    // Certaines exportations Windows créent des "Ã©" (CP1252). On tente un fallback simple :
    // Si beaucoup de "Ã", on remplace les patterns courants.
    const mojibake = (text.match(/Ã./g) || []).length > 3;
    if (mojibake) {
      // correctifs minimaux usuels (é, è, ê, à, ç, œ)
      text = text
        .replace(/Ã©/g, "é")
        .replace(/Ã¨/g, "è")
        .replace(/Ãª/g, "ê")
        .replace(/Ã /g, "à")
        .replace(/Ã§/g, "ç")
        .replace(/Å“/g, "œ")
        .replace(/Ã´/g, "ô")
        .replace(/Ã»/g, "û")
        .replace(/Ã«/g, "ë")
        .replace(/â/g, "’");
    }

    // Découpe lignes (ignore lignes vides)
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return NextResponse.json({ error: "CSV vide" }, { status: 400 });
    }

    // On ne suppose pas d’en-tête fiable. Chaque ligne = [code, description, unite, qty, unitPrice, total, lotSection?]
    // Exemple fourni (tab): 3.2.1.5\tÉvacuation...\tM3\t40.00\t16.00\t640.00\t3.2 TERRASSEMENTS / FONDATIONS
    const sep = guessSplit(lines[0]);

    // Crée le marché
    const marche = await prisma.marche.create({
      data: {
        projectId,
        entrepriseId,
        reference: file.name, // on met le nom du fichier en référence (modifiable ensuite)
      },
    });

    const batch: any[] = [];

    for (const raw of lines) {
      const cols = raw.split(sep).map((c) => c.trim());
      if (cols.length < 2) continue; // ligne vide/inutile

      const code = cols[0] || null;
      const description = cols[1] || "";
      const unite = cols[2] || null;
      const qty = toNumber(cols[3]);
      const unitPriceHt = toNumber(cols[4]);
      const totalHt = cols[5] ? toNumber(cols[5]) : qty * unitPriceHt;
      const lot = (cols[6] && cols[6] !== "-") ? cols[6] : lotLabel;

      // skip lignes entêtes éventuelles (si description trop courte ET pas de montant)
      if (!description && totalHt === 0) continue;

      batch.push({
        marcheId: marche.id,
        code,
        description,
        unite,
        qty,
        unitPriceHt,
        totalHt,
        lot,
        validatedHt: 0,
      });
    }

    if (batch.length === 0) {
      return NextResponse.json({ error: "Aucune ligne DPGF valide détectée" }, { status: 400 });
    }

    // insertMany
    await prisma.dpgfLine.createMany({ data: batch });

    // Totaux (pour retour)
    const total = batch.reduce((s, l) => s + (l.totalHt ?? 0), 0);

    return NextResponse.json({
      created: {
        marcheId: marche.id,
        projectId,
        entrepriseId,
        lines: batch.length,
        totalHt: total,
      },
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Import failed" }, { status: 500 });
  }
}
