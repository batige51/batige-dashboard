"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import HomeButton from "@/components/ui/HomeButton";

type ParsedRow = {
  code: string;
  designation: string;
  unite: string;
  quantite: number;
  pu_ht: number;
  total_ht: number;
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Next 15: params est une Promise
  const [marche, setMarche] = useState<any>(null);
  const [dpgf, setDpgf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/marches/${id}/dpgf`, { cache: "no-store" });
    const data = await res.json();
    setDpgf(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    setMarche({ id });
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <HomeButton />

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Marché #{id}</h1>
        </div>

        {/* Bloc Import CSV */}
        <ImportCsv marcheId={id} onImported={load} />

        {/* DPGF actuelle */}
        <div className="rounded border bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Désignation</th>
                <th className="px-3 py-2">Unité</th>
                <th className="px-3 py-2 text-right">Qté</th>
                <th className="px-3 py-2 text-right">PU HT</th>
                <th className="px-3 py-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-2" colSpan={6}>Chargement…</td></tr>
              ) : dpgf.length === 0 ? (
                <tr><td className="px-3 py-2 text-slate-600" colSpan={6}>Aucune ligne DPGF dans ce marché.</td></tr>
              ) : (
                dpgf.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.code || "-"}</td>
                    <td className="px-3 py-2">{r.description || "-"}</td>
                    <td className="px-3 py-2">{r.unite || "-"}</td>
                    <td className="px-3 py-2 text-right">{r.qty?.toLocaleString("fr-FR")}</td>
                    <td className="px-3 py-2 text-right">{r.unitPriceHt?.toLocaleString("fr-FR")} €</td>
                    <td className="px-3 py-2 text-right">{r.totalHt?.toLocaleString("fr-FR")} €</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Composant Import CSV */
function ImportCsv({ marcheId, onImported }: { marcheId: string; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function detectDelimiter(sample: string): "," | ";" {
    const commas = (sample.match(/,/g) || []).length;
    const semis = (sample.match(/;/g) || []).length;
    return semis > commas ? ";" : ",";
  }

  function normalizeHeader(h: string) {
    return h
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[éèê]/g, "e")
      .replace(/[àâ]/g, "a")
      .replace(/[ç]/g, "c");
  }

  async function onPickFile(f?: File) {
    setErr(null);
    setRows([]);
    const ff = f || (document.getElementById("csvfile") as HTMLInputElement)?.files?.[0];
    if (!ff) return;
    setFile(ff);

    const text = await ff.text();

    const delim = detectDelimiter(text.slice(0, 2000));
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      setErr("Fichier vide.");
      return;
    }

    const headers = lines[0].split(delim).map(normalizeHeader);
    const required = ["code", "designation", "unite", "quantite", "pu_ht"];
    for (const req of required) {
      if (!headers.includes(req)) {
        setErr(`Colonne obligatoire manquante : "${req}".`);
        return;
      }
    }

    const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
    const parsed: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(delim);
      if (cells.every((c) => c.trim() === "")) continue;

      const code = (cells[idx.code] || "").trim();
      const designation = (cells[idx.designation] || "").trim();
      const unite = (cells[idx.unite] || "").trim();
      const quantite = parseNumber(cells[idx.quantite]);
      const pu_ht = parseNumber(cells[idx.pu_ht]);
      const total_ht = round2(quantite * pu_ht);

      parsed.push({ code, designation, unite, quantite, pu_ht, total_ht });
    }

    if (parsed.length === 0) {
      setErr("Aucune ligne valide détectée.");
      return;
    }

    setRows(parsed);
  }

  async function onImport() {
    if (rows.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const payload = rows.map((r) => ({
        code: r.code,
        description: r.designation,
        unite: r.unite,
        qty: r.quantite,
        unitPriceHt: r.pu_ht,
        totalHt: r.total_ht,
      }));

      const res = await fetch(`/api/marches/${marcheId}/dpgf/import?clear=1`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setFile(null);
      setRows([]);
      onImported();
      alert(`Import réussi (${Array.isArray(d) ? d.length : "OK"} lignes)`);
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  const totalPreview = useMemo(
    () => rows.reduce((s, r) => s + r.total_ht, 0),
    [rows]
  );

  return (
    <div className="rounded border bg-white p-4 space-y-3">
      <div className="text-sm font-semibold">Importer DPGF (CSV)</div>
      <div className="text-xs text-slate-600">
        Colonnes obligatoires : <code>code</code>, <code>designation</code>, <code>unite</code>, <code>quantite</code>, <code>pu_ht</code>.
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}

      <div className="flex items-center gap-3">
        <input id="csvfile" type="file" accept=".csv" onChange={(e) => onPickFile(e.target.files?.[0])} />
        <Button variant="outline" onClick={() => onPickFile()}>Prévisualiser</Button>
        <Button onClick={onImport} disabled={rows.length === 0 || busy}>
          {busy ? "Import…" : "Importer"}
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="rounded border bg-white overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Désignation</th>
                <th className="px-3 py-2">Unité</th>
                <th className="px-3 py-2 text-right">Qté</th>
                <th className="px-3 py-2 text-right">PU HT</th>
                <th className="px-3 py-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{r.code}</td>
                  <td className="px-3 py-2">{r.designation}</td>
                  <td className="px-3 py-2">{r.unite}</td>
                  <td className="px-3 py-2 text-right">{r.quantite.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 text-right">{r.pu_ht.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 text-right">{r.total_ht.toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={5} className="px-3 py-2 font-medium">Total aperçu</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {totalPreview.toLocaleString("fr-FR")} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function parseNumber(v: any) {
  if (v == null) return 0;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
