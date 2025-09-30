"use client";
import { use, useState } from "react";

function parseCsv(csv: string): any[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(";").length > 1 ? lines[0].split(";") : lines[0].split(",");
  const rows = lines.slice(1);
  return rows.map((row) => {
    const parts = row.split(";").length > 1 ? row.split(";") : row.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h.trim()] = (parts[i] ?? "").trim()));
    // mapping & coercion
    const qty = parseFloat(obj["qty"] ?? obj["quantite"] ?? "0") || 0;
    const up = parseFloat(obj["unitPriceHt"] ?? obj["prix_unitaire_ht"] ?? obj["pu_ht"] ?? "0") || 0;
    return {
      code: obj["code"] ?? obj["poste"] ?? null,
      description: obj["description"] ?? obj["libelle"] ?? "",
      unite: obj["unite"] ?? obj["u"] ?? null,
      qty,
      unitPriceHt: up,
    };
  });
}

export default function Page({ params }: { params: Promise<{ marcheId: string }> }) {
  const { marcheId } = use(params);
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [clearing, setClearing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onPreview() {
    setErr(null); setMsg(null);
    const data = parseCsv(csv);
    setRows(data);
  }

  async function onImport() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch(`/api/marches/${marcheId}/dpgf/import?clear=${clearing ? "1" : "0"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(rows),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      setMsg(`Import OK : ${data.inserted} lignes. Total lignes sur le marché : ${data.total}.${data.cleared ? " (ancien DPGF effacé)" : ""}`);
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Import DPGF — Marché #{marcheId}</h1>

      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
      {msg && <div className="rounded bg-green-50 text-green-700 p-3">{msg}</div>}

      <div className="space-y-2">
        <label className="text-sm font-medium">Colle ici ton CSV (séparateur "," ou ";")</label>
        <textarea
          className="w-full h-48 rounded border p-2 font-mono"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder='Ex: code;description;unite;qty;unitPriceHt'
        />
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onPreview} className="rounded bg-slate-600 px-4 py-2 text-white">
          Aperçu
        </button>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={clearing} onChange={(e) => setClearing(e.target.checked)} />
          Vider l’existant avant import (recommandé)
        </label>
      </div>

      {rows.length > 0 && (
        <>
          <div className="text-sm text-slate-600">
            {rows.length} lignes prêtes à importer.
          </div>
          <div className="rounded border bg-white overflow-auto max-h-80">
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
                {rows.map((r, i) => (
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
          </div>

          <button
            onClick={onImport}
            disabled={busy}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Import…" : "Importer dans le marché"}
          </button>
        </>
      )}
    </div>
  );
}
