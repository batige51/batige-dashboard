"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Dpgf = { id: number; code: string | null; description: string; totalHt: number; validatedHt: number };

function detectSep(s: string) { return s.includes(";") ? ";" : ","; }
function numFR(v: string) {
  if (!v) return 0;
  const n = Number(v.replace(/\u00a0/g," ").replace(/\s/g,"").replace(",","."));
  return isNaN(n) ? 0 : n;
}

export default function Page({ params }: { params: Promise<{ marcheId: string }> }) {
  const { marcheId } = use(params);
  const [marche, setMarche] = useState<any>(null);
  const [numero, setNumero] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [unknown, setUnknown] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/marches/${marcheId}`, { cache: "no-store" });
      const data = await res.json();
      setMarche(data);
    })();
  }, [marcheId]);

  const dpgfByCode = useMemo(() => {
    const m = new Map<string, Dpgf>();
    (marche?.dpgf || []).forEach((l: Dpgf) => {
      const key = (l.code || "").trim().toLowerCase();
      if (key) m.set(key, l);
    });
    return m;
  }, [marche]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null); setMsg(null); setRows([]); setUnknown([]);
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length>0);
    if (!lines.length) { setErr("CSV vide"); return; }

    const sep = detectSep(lines[0]);
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());

    const hasA = headers.includes("code") && headers.includes("montant_ht");
    const hasB = headers.includes("code") && headers.includes("quantite") && headers.includes("pu_ht");
    if (!hasA && !hasB) {
      setErr("En-têtes attendus: soit (code;montant_ht) soit (code;quantite;pu_ht)");
      return;
    }

    const idx: any = {};
    headers.forEach((h,i)=>idx[h]=i);
    const parsed = lines.slice(1).map(raw => {
      const c = raw.split(sep);
      const code = (c[idx["code"]] ?? "").trim();
      let requestedHt = 0;
      if (hasA) requestedHt = numFR(c[idx["montant_ht"]] ?? "");
      else requestedHt = numFR(c[idx["quantite"]] ?? "") * numFR(c[idx["pu_ht"]] ?? "");
      return { code, requestedHt };
    }).filter(r => r.code && r.requestedHt>0);

    // Match par code
    const good:any[] = [];
    const bad:any[] = [];
    for (const r of parsed) {
      const key = r.code.trim().toLowerCase();
      const d = dpgfByCode.get(key);
      if (!d) { bad.push(r); continue; }
      good.push({ dpgfLineId: d.id, requestedHt: r.requestedHt, code: r.code, description: d.description });
    }
    setRows(good);
    setUnknown(bad);
  }

  const total = useMemo(()=> rows.reduce((s,r)=>s+r.requestedHt,0), [rows]);

  async function onCreate() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (!numero.trim()) throw new Error("Renseigne le numéro de facture.");
      if (!rows.length) throw new Error("Aucune ligne valide à créer.");

      const payload = {
        projectId: marche.projectId,
        entrepriseId: marche.entrepriseId,
        marcheId: Number(marcheId),
        numero: numero.trim(),
        lines: rows.map(r => ({ dpgfLineId: r.dpgfLineId, requestedHt: r.requestedHt }))
      };

      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);

      setMsg(`Facture ${data.numero} créée (id: ${data.id}).`);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nouvelle facture — Marché #{marcheId}</h1>
        <Link href={`/marches/${marcheId}`} className="text-blue-600 hover:underline">← Retour marché</Link>
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
      {msg && <div className="rounded bg-green-50 text-green-700 p-3">{msg}</div>}

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Numéro de facture</label>
          <input
            className="border rounded px-2 py-1"
            placeholder="F-2025-001"
            value={numero}
            onChange={(e)=>setNumero(e.target.value)}
          />
        </div>

        <div className="text-sm">
          <b>CSV accepté</b> (séparateur “;” ou “,”)
          <div className="mt-1 font-mono">
            Variante A: code;montant_ht
          </div>
          <div className="font-mono text-slate-600">
            CAR-001;1200
          </div>
          <div className="mt-1 font-mono">
            Variante B: code;quantite;pu_ht
          </div>
          <div className="font-mono text-slate-600">
            CAR-002;35;33
          </div>
        </div>

        <input type="file" accept=".csv,text/csv" onChange={onFile} />

        {rows.length > 0 && (
          <div className="rounded border bg-white overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Demandé (HT)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{r.code}</td>
                    <td className="px-3 py-2">{r.description}</td>
                    <td className="px-3 py-2 text-right">{r.requestedHt.toLocaleString("fr-FR")} €</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td className="px-3 py-2 font-medium" colSpan={2}>Total demandé</td>
                  <td className="px-3 py-2 text-right font-semibold">{total.toLocaleString("fr-FR")} €</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {unknown.length > 0 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
            <b>Codes inconnus (non trouvés dans le DPGF):</b>
            <ul className="list-disc pl-6">
              {unknown.map((u,i)=> <li key={i}>{u.code} — {u.requestedHt.toLocaleString("fr-FR")} €</li>)}
            </ul>
            <div className="mt-1 text-amber-700">
              Vérifie que les <b>codes</b> de ton CSV = codes DPGF du marché.
            </div>
          </div>
        )}

        <div>
          <button
            onClick={onCreate}
            disabled={busy || !numero.trim() || rows.length===0}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Création…" : "Créer la facture"}
          </button>
        </div>
      </div>
    </div>
  );
}
