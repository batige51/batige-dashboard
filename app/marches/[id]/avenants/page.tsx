"use client";
import { use, useEffect, useState } from "react";

type Line = { dpgfLineId: number; deltaHt: number };
type Avenant = {
  id: number;
  numero: string;
  statut: "BROUILLON" | "VALIDE";
  date: string;
  lines: Array<{ id:number; deltaHt:number; dpgfLine: { id:number; code:string|null; description:string } }>
};

export default function Page({ params }:{ params: Promise<{ id:string }> }) {
  const { id } = use(params);
  const [list, setList] = useState<Avenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // Formulaire simple
  const [numero, setNumero] = useState("");
  const [statut, setStatut] = useState<"BROUILLON"|"VALIDE">("BROUILLON");
  const [lines, setLines] = useState<Line[]>([{ dpgfLineId: 1, deltaHt: 0 }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/marches/${id}/avenants`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setList(d);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); }, [id]);

  async function submit() {
    setBusy(true); setMsg(null); setErr(null);
    try {
      const res = await fetch(`/api/marches/${id}/avenants`, {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ numero, statut, lines }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setMsg(`Avenant créé #${d.id}`);
      setNumero("");
      setLines([{ dpgfLineId: 1, deltaHt: 0 }]);
      await load();
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-xl font-bold">Avenants — Marché #{id}</div>

      {/* Formulaire création */}
      <div className="rounded border p-4 space-y-3">
        <div className="font-medium">Créer un avenant</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="rounded border px-2 py-1" placeholder="Numéro d'avenant"
                 value={numero} onChange={(e)=>setNumero(e.target.value)} />
          <select className="rounded border px-2 py-1" value={statut} onChange={(e)=>setStatut(e.target.value as any)}>
            <option value="BROUILLON">BROUILLON</option>
            <option value="VALIDE">VALIDE</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-slate-600">Lignes (dpgfLineId / delta HT)</div>
          {lines.map((l, i)=>(
            <div key={i} className="flex gap-2">
              <input className="rounded border px-2 py-1 w-40" type="number"
                     value={l.dpgfLineId} onChange={(e)=>{
                       const v = parseInt(e.target.value||"0",10);
                       setLines(prev=>prev.map((x,idx)=> idx===i? {...x, dpgfLineId: v}: x));
                     }}/>
              <input className="rounded border px-2 py-1 w-40" type="number" step="0.01"
                     value={l.deltaHt} onChange={(e)=>{
                       const v = parseFloat(e.target.value||"0");
                       setLines(prev=>prev.map((x,idx)=> idx===i? {...x, deltaHt: v}: x));
                     }}/>
              <button className="rounded border px-3" onClick={()=>{
                setLines(prev=>prev.filter((_,idx)=>idx!==i));
              }}>Supprimer</button>
            </div>
          ))}
          <button className="rounded border px-3 py-1 text-sm" onClick={()=>{
            setLines(prev=>[...prev, { dpgfLineId: 1, deltaHt: 0 }]);
          }}>+ Ajouter une ligne</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={submit} disabled={busy || !numero}
                  className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Création…" : "Créer l'avenant"}
          </button>
          {msg && <span className="text-green-700 text-sm">{msg}</span>}
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </div>

      {/* Liste avenants */}
      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left w-24">#</th>
              <th className="px-2 py-2 text-left">Numéro</th>
              <th className="px-2 py-2 text-left">Statut</th>
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-left">Lignes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-2 py-2" colSpan={5}>Chargement…</td></tr>
            ) : list.length === 0 ? (
              <tr><td className="px-2 py-2" colSpan={5}>Aucun avenant</td></tr>
            ) : list.map((a)=>(
              <tr key={a.id} className="border-t align-top">
                <td className="px-2 py-2">{a.id}</td>
                <td className="px-2 py-2">{a.numero}</td>
                <td className="px-2 py-2">{a.statut}</td>
                <td className="px-2 py-2">{new Date(a.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-2 py-2">
                  <ul className="list-disc pl-5">
                    {a.lines.map(l=>(
                      <li key={l.id}>
                        {l.dpgfLine?.code || "-"} — {l.dpgfLine?.description || "-"} :
                        {" "}{(l.deltaHt||0).toLocaleString("fr-FR")} €
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-600">
        * Les deltas d’avenant sont déjà appliqués au budget (DPGF.totalHt mis à jour).
      </div>
    </div>
  );
}
