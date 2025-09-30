"use client";
import { use, useState } from "react";

// Colonnes attendues (verrouillées)
const REQUIRED_HEADERS = ["code", "designation", "unite", "quantite", "pu_ht"] as const;
type RequiredHeader = typeof REQUIRED_HEADERS[number];

function detectSep(headerLine: string) {
  // Si la ligne d'en-tête contient ";", on prend ";", sinon ","
  return headerLine.includes(";") ? ";" : ",";
}

function parseNumberFR(v: string): number {
  if (!v) return 0;
  const s = v.replace(/\u00a0/g, " ").replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export default function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [busy, setBusy] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    setMsg(null);
    setPreview(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setErr("Fichier CSV vide.");
      return;
    }

    const sep = detectSep(lines[0]);
    const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());

    // Vérifier EXACTEMENT les en-têtes requis
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length) {
      setErr(
        `Colonnes manquantes : ${missing.join(
          ", "
        )}. En-têtes attendus (exactement) : ${REQUIRED_HEADERS.join(", ")}`
      );
      return;
    }

    // Construire l'index de chaque colonne
    const idx: Record<RequiredHeader, number> = {
      code: headers.indexOf("code"),
      designation: headers.indexOf("designation"),
      unite: headers.indexOf("unite"),
      quantite: headers.indexOf("quantite"),
      pu_ht: headers.indexOf("pu_ht"),
    } as const;

    // Parser lignes -> payload JSON attendu par l'API
    const rows = lines.slice(1).map((raw) => {
      const cols = raw.split(sep);
      const code = (cols[idx.code] ?? "").trim() || null;
      const description = (cols[idx.designation] ?? "").trim();
      const unite = (cols[idx.unite] ?? "").trim() || null;
      const qty = parseNumberFR(cols[idx.quantite] ?? "");
      const unitPriceHt = parseNumberFR(cols[idx.pu_ht] ?? "");
      return { code, description, unite, qty, unitPriceHt };
    }).filter(r => r.description); // on ignore les lignes vides

    if (rows.length === 0) {
      setErr("Aucune ligne exploitable (colonne 'designation' vide).");
      return;
    }

    setPreview(rows.slice(0, 50)); // aperçu 50 lignes
    // On garde les rows dans un dataset temporaire accroché à l'input via dataset (simple)
    (e.target as any)._parsedRows = rows;
  }

  async function onImportClick(e: React.MouseEvent<HTMLButtonElement>) {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const input = document.getElementById("file") as HTMLInputElement & { _parsedRows?: any[] };
      const rows = input?._parsedRows;
      if (!rows || rows.length === 0) throw new Error("Veuillez sélectionner un CSV valide avant d'importer.");

      const res = await fetch(`/api/marches/${id}/dpgf/import?clear=${clearExisting ? "1" : "0"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(rows),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);

      setMsg(`Import OK : ${data.inserted} lignes. Total sur le marché : ${data.total}${data.cleared ? " (ancien DPGF effacé)" : ""}.`);
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Importer un DPGF — Marché #{id}</h1>

      <div className="rounded border bg-white p-4">
        <div className="text-sm mb-2">
          <b>Format CSV requis (séparateur “;” ou “,”) :</b>
          <div className="font-mono mt-1">
            code;designation;unite;quantite;pu_ht
          </div>
          <div className="font-mono text-slate-600">
            3 111;Mesures préliminaires;FT;1;480
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input id="file" type="file" accept=".csv,text/csv" onChange={onFileChange} />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
            />
            Vider l’existant avant import (recommandé)
          </label>
          <button
            onClick={onImportClick}
            disabled={busy}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Import…" : "Importer"}
          </button>
        </div>
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
      {msg && <div className="rounded bg-green-50 text-green-700 p-3">{msg}</div>}

      {preview && (
        <div className="rounded border bg-white overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Unité</th>
                <th className="px-3 py-2 text-right">Qté</th>
                <th className="px-3 py-2 text-right">PU HT</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{r.code || "-"}</td>
                  <td className="px-3 py-2">{r.description}</td>
                  <td className="px-3 py-2">{r.unite || "-"}</td>
                  <td className="px-3 py-2 text-right">{r.qty}</td>
                  <td className="px-3 py-2 text-right">{r.unitPriceHt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 text-xs text-slate-600">Aperçu (50 premières lignes au maximum).</div>
        </div>
      )}
    </div>
  );
}
