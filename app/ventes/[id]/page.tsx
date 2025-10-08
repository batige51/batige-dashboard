import { Button } from "@/components/ui/button";
"use client";
import { use, useEffect, useMemo, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  );
  
  
  const { id } = use(params); // lot id
  const [lot, setLot] = useState<any>(null);

  const [formVente, setFormVente] = useState({ client: "", prixVenteHt: "", tvaRate: "20" });
  const [formTma, setFormTma] = useState({ venteId: "", code: "", description: "", deltaHt: "" });

  async function reload() {
    const res = await fetch(`/api/ventes/${id}`, { cache: "no-store" });
    const d = await res.json(); setLot(d);
  }
  useEffect(() => { reload(); }, [id]);

  const f = (n:number)=> (n||0).toLocaleString("fr-FR")+" €";

  const synthese = useMemo(() => {
    if (!lot?.ventes) return [];
    return lot.ventes.map((v:any) => {
      const tmaHt = (v.tmas||[]).reduce((s:number, t:any)=> s + (t.deltaHt || 0), 0);
      const ht = (v.prixVenteHt || 0) + tmaHt;
      const ttc = ht * (1 + (v.tvaRate||0)/100);
      return { id: v.id, client: v.client, prixHt: v.prixVenteHt||0, tmaHt, ht, ttc, tvaRate: v.tvaRate||0 };
    });
  }, [lot]);


  return (
    <div className="p-6 space-y-6">

      {/* Ajout vente */}
      <div className="rounded border p-4 bg-white space-y-2">
        <div className="grid md:grid-cols-3 gap-2">
          <input className="rounded border px-2 py-1" placeholder="Client"
                 value={formVente.client} onChange={e=>setFormVente({...formVente,client:e.target.value})}/>
          <input className="rounded border px-2 py-1" type="number" placeholder="Prix HT"
                 value={formVente.prixVenteHt} onChange={e=>setFormVente({...formVente,prixVenteHt:e.target.value})}/>
          <input className="rounded border px-2 py-1" type="number" placeholder="TVA %"
                 value={formVente.tvaRate} onChange={e=>setFormVente({...formVente,tvaRate:e.target.value})}/>
        <button className="rounded bg-blue-600 text-white px-3 py-1.5"
                onClick={async ()=>{
                  await fetch(`/api/ventes/${id}`,{
                    method:"POST", headers:{"content-type":"application/json"},
                    body: JSON.stringify({ ...formVente }),
                  });
                  setFormVente({ client:"", prixVenteHt:"", tvaRate:"20" });
                  reload();
                }}>Ajouter</button>

      {/* Liste ventes + TMA */}
      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">Client</th>
              <th className="px-2 py-2 text-right">Prix HT</th>
              <th className="px-2 py-2 text-right">TMA (±)</th>
              <th className="px-2 py-2 text-right">Total HT</th>
              <th className="px-2 py-2 text-right">TVA %</th>
              <th className="px-2 py-2 text-right">Total TTC</th>
              <th className="px-2 py-2 text-right">TMA +</th>
            </tr>
          </thead>
          <tbody>
            {(synthese||[]).map((v:any)=>(
              <tr key={v.id} className="border-t">
                <td className="px-2 py-1">{v.client}</td>
                <td className="px-2 py-1 text-right">{f(v.prixHt)}</td>
                <td className="px-2 py-1 text-right">{f(v.tmaHt)}</td>
                <td className="px-2 py-1 text-right">{f(v.ht)}</td>
                <td className="px-2 py-1 text-right">{v.tvaRate}</td>
                <td className="px-2 py-1 text-right">{f(v.ttc)}</td>
                <td className="px-2 py-1 text-right">
                  <TmaForm venteId={v.id} onOk={reload}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

  );
}

function TmaForm({ venteId, onOk }:{ venteId:number; onOk:()=>void }) {
  const [code,setCode] = useState(""); const [desc,setDesc]=useState("");
  const [delta,setDelta] = useState("");
  return (
    <div className="flex gap-1 justify-end">
      <input className="rounded border px-2 py-1 w-20" placeholder="Code" value={code} onChange={e=>setCode(e.target.value)}/>
      <input className="rounded border px-2 py-1 w-40" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)}/>
      <input className="rounded border px-2 py-1 w-24" type="number" placeholder="Δ HT" value={delta} onChange={e=>setDelta(e.target.value)}/>
      <button className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
              onClick={async ()=>{
                await fetch(`/api/ventes/tma/${venteId}`,{
                  method:"POST", headers:{"content-type":"application/json"},
                  body: JSON.stringify({ code, description: desc, deltaHt: Number(delta||0) })
                });
                setCode(""); setDesc(""); setDelta(""); onOk();
              }}>+ TMA</button>
  );
}
