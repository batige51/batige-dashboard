"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Dpgf = { id: number; code: string | null; description: string; totalHt: number; validatedHt: number };

export default function Page({ params }: { params: Promise<{ marcheId: string }> }) {
  const { marcheId } = use(params);
  const [marche, setMarche] = useState<any>(null);
  const [rows, setRows] = useState<{ dpgfLineId: number; code: string; description: string; deltaHt: string }[]>([]);
  const [numero, setNumero] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/marches/${marcheId}`, { cache: "no-store" });
      const data = await res.json();
      setMarche(data);
    })();
  }, [marcheId]);

  const dpgf = useMemo<Dpgf[]>(() => marche?.dpgf || [], [marche]);

  function addLine(d: Dpgf) {
    setRows((cur) => [...cur, {
      dpgfLineId: d.id,
      code: d.code || "",
      description: d.description,
      deltaHt: "0"
    }]);
  }
  function removeLine(i: number) {
    setRows((cur) => cur.filter((_, idx) => idx !== i));
  }
  function updateDelta(i: number, v: string) {
    setRows((cur) => cur.map((r, idx) => idx === i ? { ...r, deltaHt: v } : r));
  }

  const totalDelta = useMemo(() => rows.reduce((s, r) => s + (parseFloat(r.deltaHt) || 0), 0), [rows]);

  async function onCreate() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (!numero.trim()) throw new Error("Renseigne le numéro d'avenant.");
      const lines = rows
        .map(r => ({ dpgfLineId: r.dpgfLineId, deltaHt: Number(r.deltaHt || 0) }))
        .filter(l => l.deltaHt !== 0);
      if (lines.length === 0) throw new Error("Ajoute au moins une ligne avec un delta non nul.");

      const res = await fetch("/api/avenants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marcheId: Number(marcheId), numero: numero.trim(), lines })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      setCreatedId(data.id);
      setMsg(`Avenant ${data.numero} créé (id: ${data.id}). Tu peux le valider.`);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally { setBusy(false); }
  }

  async function onValidate() {
    if (!createdId) return;
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch(`/api/avenants/${createdId}/valider`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      setMsg(`Avenant validé. Il est pris en compte dans le Budget.`);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nouvel avenant — Marché #{marcheId}</h1>
        <Link className="text-blue-600 hover:underline" href={`/marches/${marcheId}`}>← Retour marché</Link>
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
      {msg && <div className="rounded bg-green-50 text-green-700 p-3">{msg}</div>}

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Numéro d’avenant</label>
          <input className="border rounded px-2 py-1" placeholder="AV-001" value={numero} onChange={(e)=>setNumero(e.target.value)} />
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Ajouter une ligne depuis le DPGF</div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-auto border rounded p-2 bg-slate-50">
            {dpgf.map((l) => (
              <button
                key={l.id}
                onClick={()=>addLine(l)}
                className="rounded border px-2 py-1 text-sm hover:bg-white"
                title={l.description}
              >
                {l.code || "-"} ({l.totalHt.toLocaleString("fr-FR")} €)
              </button>
            ))}
          </div>
        </div>

        {rows.length > 0 && (
          <div className="rounded border bg-white overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Δ HT (positif / négatif)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{r.code || "-"}</td>
                    <td className="px-3 py-2">{r.description}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="w-40 rounded border px-2 py-1 text-right"
                        value={r.deltaHt}
                        onChange={(e)=>updateDelta(i, e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={()=>removeLine(i)} className="text-red-600 hover:underline">Retirer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td className="px-3 py-2 font-medium" colSpan={2}>Total avenant</td>
                  <td className="px-3 py-2 text-right font-semibold">{totalDelta.toLocaleString("fr-FR")} €</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onCreate}
            disabled={busy || !numero.trim() || rows.length===0}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Création…" : "Créer l’avenant"}
          </button>
          {createdId && (
            <button
              onClick={onValidate}
              disabled={busy}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Valider l’avenant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
