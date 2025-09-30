"use client";
import { use, useEffect, useMemo, useState } from "react";

export default function Page({ params }:{ params: Promise<{ id:string }> }) {
  const { id } = use(params);
  const [vente, setVente] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  // form TMA
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [delta, setDelta] = useState<string>("0");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/ventes/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setVente(d);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{ load(); }, [id]);

  async function addTma() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/ventes/${id}/tma`, {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ code: code || undefined, description, deltaHt: parseFloat(delta || "0") }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setCode(""); setDescription(""); setDelta("0");
      await load();
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  const totals = useMemo(()=>{
    if (!vente) return null;
    const htBase = vente.prixVenteHt || 0;
    const tma = vente.tmaTotalHt || 0;
    const ht = htBase + tma;
    const tva = ht * ((vente.tvaRate || 0)/100);
    const ttc = ht + tva;
    return { htBase, tma, ht, tva, ttc };
  }, [vente]);

  const fmt = (n:number)=> n.toLocaleString("fr-FR")+" €";

  if (loading) return <div className="p-6">Chargement…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!vente || !totals) return <div className="p-6">Vente introuvable</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold">Vente — Lot {vente.lot?.numero}</div>
        <a className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50" href={`/ventes/${id}/print`} target="_blank">
          Imprimer
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border p-3">
          <div><b>Client</b> : {vente.client}</div>
          <div><b>TVA</b> : {(vente.tvaRate||0).toLocaleString("fr-FR")}%</div>
          <div><b>Prix catalogue (lot)</b> : {fmt(vente.lot?.prixCatalogueHt || 0)}</div>
          <div><b>Prix vente HT</b> : {fmt(vente.prixVenteHt || 0)}</div>
        </div>
        <div className="rounded border p-3">
          <div className="font-semibold mb-1">Synthèse</div>
          <div className="flex justify-between"><span>Base HT</span><span>{fmt(totals.htBase)}</span></div>
          <div className="flex justify-between"><span>TMA (±)</span><span>{fmt(totals.tma)}</span></div>
          <div className="flex justify-between"><span>Total HT</span><span className="font-semibold">{fmt(totals.ht)}</span></div>
          <div className="flex justify-between"><span>TVA</span><span>{fmt(totals.tva)}</span></div>
          <div className="flex justify-between"><span>Total TTC</span><span className="font-bold">{fmt(totals.ttc)}</span></div>
        </div>
        <div className="rounded border p-3">
          <div className="font-semibold mb-1">Ajouter une TMA</div>
          <input className="rounded border px-2 py-1 mb-2 w-full" placeholder="Code (optionnel)" value={code} onChange={e=>setCode(e.target.value)} />
          <input className="rounded border px-2 py-1 mb-2 w-full" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
          <input className="rounded border px-2 py-1 mb-2 w-full" placeholder="Delta HT (ex: 1200 ou -300)" type="number" step="0.01" value={delta} onChange={e=>setDelta(e.target.value)} />
          <button onClick={addTma} disabled={busy || !description} className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Ajout…" : "Ajouter"}
          </button>
          {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
        </div>
      </div>

      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left w-24">Code</th>
              <th className="px-2 py-2 text-left">Description</th>
              <th className="px-2 py-2 text-right w-28">Delta HT</th>
            </tr>
          </thead>
          <tbody>
            {(vente.tmas||[]).map((t:any)=>(
              <tr key={t.id} className="border-t">
                <td className="px-2 py-1">{t.code || "-"}</td>
                <td className="px-2 py-1">{t.description}</td>
                <td className="px-2 py-1 text-right">{(t.deltaHt||0).toLocaleString("fr-FR")} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
