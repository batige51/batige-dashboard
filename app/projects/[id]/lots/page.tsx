"use client";
import { use, useEffect, useState } from "react";

type Lot = { id:number; numero:string; typologie?:string|null; surface?:number|null; prixCatalogueHt:number };

export default function Page({ params }:{ params: Promise<{ id:string }> }) {
  const { id } = use(params);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // form lot
  const [numero, setNumero] = useState("");
  const [typologie, setTypologie] = useState("");
  const [surface, setSurface] = useState<string>("");
  const [prix, setPrix] = useState<string>("0");

  // form vente
  const [venteLotId, setVenteLotId] = useState<number|undefined>(undefined);
  const [client, setClient] = useState("");
  const [prixVente, setPrixVente] = useState<string>(""); // optionnel (sinon prix catalogue)
  const [tvaRate, setTvaRate] = useState<string>("20");

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/projects/${id}/lots`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setLots(d);
      if (!venteLotId && d.length) setVenteLotId(d[0].id);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); }, [id]);

  async function createLot() {
    try {
      const res = await fetch(`/api/projects/${id}/lots`, {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({
          numero,
          typologie: typologie || undefined,
          surface: surface ? parseFloat(surface) : undefined,
          prixCatalogueHt: prix ? parseFloat(prix) : 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setNumero(""); setTypologie(""); setSurface(""); setPrix("0");
      await load();
    } catch (e:any) {
      alert(e.message || "Erreur");
    }
  }

  async function createVente() {
    if (!venteLotId || !client) { alert("Choisis un lot et renseigne le client"); return; }
    try {
      const res = await fetch(`/api/ventes`, {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({
          lotId: venteLotId,
          client,
          prixVenteHt: prixVente ? parseFloat(prixVente) : undefined,
          tvaRate: tvaRate ? parseFloat(tvaRate) : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      // ouvrir la vente
      window.open(`/ventes/${d.id}`, "_blank");
      setClient(""); setPrixVente("");
    } catch (e:any) {
      alert(e.message || "Erreur");
    }
  }

  const fmt = (n:number)=> n.toLocaleString("fr-FR")+" €";

  return (
    <div className="p-6 space-y-6">
      <div className="text-xl font-bold">Lots — Projet #{id}</div>

      {/* Créer un lot */}
      <div className="rounded border p-4 space-y-2">
        <div className="font-medium">Créer un lot</div>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="rounded border px-2 py-1" placeholder="Numéro" value={numero} onChange={e=>setNumero(e.target.value)} />
          <input className="rounded border px-2 py-1" placeholder="Typologie" value={typologie} onChange={e=>setTypologie(e.target.value)} />
          <input className="rounded border px-2 py-1" placeholder="Surface" type="number" step="0.01" value={surface} onChange={e=>setSurface(e.target.value)} />
          <input className="rounded border px-2 py-1" placeholder="Prix catalogue HT" type="number" step="0.01" value={prix} onChange={e=>setPrix(e.target.value)} />
        </div>
        <button onClick={createLot} disabled={!numero} className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50">Créer</button>
      </div>

      {/* Créer une vente */}
      <div className="rounded border p-4 space-y-2">
        <div className="font-medium">Créer une vente</div>
        <div className="grid md:grid-cols-4 gap-2">
          <select className="rounded border px-2 py-1" value={venteLotId} onChange={e=>setVenteLotId(parseInt(e.target.value,10))}>
            {lots.map(l=> <option key={l.id} value={l.id}>Lot {l.numero} — {fmt(l.prixCatalogueHt)}</option>)}
          </select>
          <input className="rounded border px-2 py-1" placeholder="Client" value={client} onChange={e=>setClient(e.target.value)} />
          <input className="rounded border px-2 py-1" placeholder="Prix Vente HT (optionnel)" type="number" step="0.01" value={prixVente} onChange={e=>setPrixVente(e.target.value)} />
          <input className="rounded border px-2 py-1" placeholder="TVA %" type="number" step="0.1" value={tvaRate} onChange={e=>setTvaRate(e.target.value)} />
        </div>
        <button onClick={createVente} disabled={!venteLotId || !client} className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50">Créer la vente</button>
      </div>

      {/* Liste lots */}
      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Numéro</th>
              <th className="px-2 py-2 text-left">Typologie</th>
              <th className="px-2 py-2 text-right">Surface</th>
              <th className="px-2 py-2 text-right">Prix catalogue HT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-2 py-2" colSpan={5}>Chargement…</td></tr>
            ) : err ? (
              <tr><td className="px-2 py-2 text-red-600" colSpan={5}>{err}</td></tr>
            ) : lots.length===0 ? (
              <tr><td className="px-2 py-2" colSpan={5}>Aucun lot</td></tr>
            ) : lots.map(l=>(
              <tr key={l.id} className="border-t">
                <td className="px-2 py-1">{l.id}</td>
                <td className="px-2 py-1">{l.numero}</td>
                <td className="px-2 py-1">{l.typologie || "-"}</td>
                <td className="px-2 py-1 text-right">{l.surface ?? "-"}</td>
                <td className="px-2 py-1 text-right">{fmt(l.prixCatalogueHt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
