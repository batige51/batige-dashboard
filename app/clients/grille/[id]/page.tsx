"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length>0);
  if (!lines.length) return { headers: [], rows: [] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(raw => {
    const c = raw.split(sep);
    const obj: any = {};
    headers.forEach((h,i)=> obj[h] = (c[i] ?? "").trim());
    return obj;
  });
  return { headers, rows };
}
function numFR(v: string) {
  if (!v) return 0;
  const n = Number(v.replace(/\u00a0/g," ").replace(/\s/g,"").replace(",","."));
  return isNaN(n) ? 0 : n;
}

export default function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clear, setClear] = useState(true);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [fileEl, setFileEl] = useState<HTMLInputElement | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${projectId}/lots`, { cache: "no-store" });
    const data = await res.json();
    setLots(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  useEffect(()=>{ load(); }, [id]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null); setMsg(null);
    const f = e.target.files?.[0];
    setFileEl(e.target);
    if (!f) return;
    const text = await f.text();
    const { headers, rows } = parseCSV(text);
    const required = ["numero","typologie","surface","prix_catalogue_ht"];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length) {
      setErr(`Colonnes manquantes: ${missing.join(", ")}. En-têtes requis: ${required.join(", ")}`);
      return;
    }
    const mapped = rows.map((r:any)=> ({
      numero: r["numero"],
      typologie: r["typologie"] || null,
      surface: numFR(r["surface"] || ""),
      prix_catalogue_ht: numFR(r["prix_catalogue_ht"] || "")
    }));
    setPreview(mapped.slice(0,50));
    (e.target as any)._rows = mapped;
  }

  async function onImport() {
    if (!fileEl || !(fileEl as any)._rows) { setErr("Sélectionne un CSV valide d'abord."); return; }
    setErr(null); setMsg(null);
    const rows = (fileEl as any)._rows;
    const res = await fetch(`/api/projects/${projectId}/lots/import?clear=${clear ? "1":"0"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rows),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data?.error || `Erreur ${res.status}`); return; }
    setMsg(`Import OK: ${data.inserted} lots. Total: ${data.total}${data.cleared ? " (vidage avant import)" : ""}.`);
    setPreview(null);
    await load();
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Grille client — Projet #{projectId}</h1>

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="text-sm">
          Format CSV requis : <code className="bg-slate-100 px-1 py-0.5 rounded">numero;typologie;surface;prix_catalogue_ht</code>
        </div>
        <div className="flex items-center gap-4">
          <input type="file" accept=".csv,text/csv" onChange={onFile} />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clear} onChange={(e)=>setClear(e.target.checked)} />
            Vider les lots du projet avant import
          </label>
          <button onClick={onImport} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Importer
          </button>
        </div>
        {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
        {msg && <div className="rounded bg-green-50 text-green-700 p-3">{msg}</div>}
        {preview && (
          <div className="rounded border bg-white overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2">N°</th>
                  <th className="px-3 py-2">Typo</th>
                  <th className="px-3 py-2 text-right">Surface</th>
                  <th className="px-3 py-2 text-right">Prix cat. HT</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r,i)=>(
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{r.numero}</td>
                    <td className="px-3 py-2">{r.typologie || "-"}</td>
                    <td className="px-3 py-2 text-right">{r.surface}</td>
                    <td className="px-3 py-2 text-right">{r.prix_catalogue_ht}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded border bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">N°</th>
              <th className="px-3 py-2">Typologie</th>
              <th className="px-3 py-2 text-right">Surface</th>
              <th className="px-3 py-2 text-right">Prix cat. HT</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-2" colSpan={5}>Chargement…</td></tr>
            ) : lots.length === 0 ? (
              <tr><td className="px-3 py-2 text-slate-600" colSpan={5}>Aucun lot. Importez le CSV.</td></tr>
            ) : lots.map((l:any)=>(
              <tr key={l.id} className="border-t">
                <td className="px-3 py-2">{l.numero}</td>
                <td className="px-3 py-2">{l.typologie || "-"}</td>
                <td className="px-3 py-2 text-right">{l.surface ?? "-"}</td>
                <td className="px-3 py-2 text-right">{(l.prixCatalogueHt || 0).toLocaleString("fr-FR")} €</td>
                <td className="px-3 py-2">
                  <Link className="text-blue-600 hover:underline" href={`/ventes/nouvelle/${l.id}`}>Nouvelle vente</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
