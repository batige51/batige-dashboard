"use client";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: marcheId } = use(params);
  const [form, setForm] = useState({ numero: "", date: "", statut: "BROUILLON" });
  const [rows, setRows] = useState<Array<{ dpgfLineId: string; deltaHt: string }>>([{ dpgfLineId: "", deltaHt: "" }]);

  const addRow = ()=> setRows([...rows, { dpgfLineId:"", deltaHt:"" }]);
  const setRow = (i:number, patch:any)=> setRows(rows.map((r,idx)=> idx===i ? {...r, ...patch} : r ));
  const delRow = (i:number)=> setRows(rows.filter((_r,idx)=> idx!==i));

  return (
    <div className="p-6 space-y-4">
      <div className="text-2xl font-bold">Nouvel avenant — Marché #{marcheId}</div>

      <div className="rounded border p-4 bg-white grid md:grid-cols-3 gap-2">
        <input className="rounded border px-2 py-1" placeholder="Numéro" value={form.numero} onChange={e=>setForm({...form, numero:e.target.value})}/>
        <input className="rounded border px-2 py-1" type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
        <select className="rounded border px-2 py-1" value={form.statut} onChange={e=>setForm({...form, statut:e.target.value})}>
          <option value="BROUILLON">BROUILLON</option>
          <option value="VALIDE">VALIDE</option>
        </select>
      </div>

      <div className="rounded border p-4 bg-white space-y-2">
        <div className="font-medium">Lignes (+/− HT)</div>
        {rows.map((r, i)=>(
          <div key={i} className="grid md:grid-cols-3 gap-2">
            <input className="rounded border px-2 py-1" placeholder="DPGF line id" value={r.dpgfLineId} onChange={e=>setRow(i,{ dpgfLineId:e.target.value })}/>
            <input className="rounded border px-2 py-1" type="number" placeholder="Delta HT" value={r.deltaHt} onChange={e=>setRow(i,{ deltaHt:e.target.value })}/>
            <button className="rounded border px-2 py-1 text-sm hover:bg-slate-50" onClick={()=>delRow(i)}>Supprimer</button>
          </div>
        ))}
        <button className="rounded border px-2 py-1 text-sm hover:bg-slate-50" onClick={addRow}>+ Ligne</button>
      </div>

      <button
        className="rounded bg-blue-600 text-white px-3 py-1.5"
        onClick={async ()=>{
          const res = await fetch("/api/avenants", {
            method: "POST",
            headers: {"content-type":"application/json"},
            body: JSON.stringify({
              marcheId: Number(marcheId),
              ...form,
              lines: rows.filter(r=> r.dpgfLineId && r.deltaHt),
            }),
          });
          if (res.ok) {
            alert("Avenant créé");
          } else {
            const d = await res.json(); alert(d?.error || "Erreur");
          }
        }}
      >Créer l’avenant</button>
    </div>
  );
}
