"use client";
import { use, useEffect, useMemo, useState } from "react";

type Line = {
  id: number;
  code?: string|null;
  description?: string|null;
  unite?: string|null;
  qty: number;
  unitPriceHt: number;
  totalHt: number;
  validatedHt: number;
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // marche
  const [rows, setRows] = useState<Line[]|null>(null);
  const [err, setErr] = useState<string|null>(null);

  // formulaire ajout
  const [add, setAdd] = useState({ code:"", description:"", unite:"", qty:"0", unit:"0" });
  const f = (n:number)=> (n||0).toLocaleString("fr-FR")+" €";

  async function load() {
    setErr(null);
    const res = await fetch(`/api/marches/${id}/dpgf`, { cache: "no-store" });
    const d = await res.json();
    if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
    setRows(d);
  }
  useEffect(()=>{ load(); },[id]);

  async function save(l: Line, patch: Partial<Line>) {
    setErr(null);
    const body:any = {};
    if (patch.code !== undefined) body.code = patch.code;
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.unite !== undefined) body.unite = patch.unite;
    if (patch.qty !== undefined) body.qty = patch.qty;
    if (patch.unitPriceHt !== undefined) body.unitPriceHt = patch.unitPriceHt;

    const res = await fetch(`/api/dpgf/${l.id}`, { method:"PATCH", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
    await load();
  }

  async function remove(l: Line) {
    setErr(null);
    const res = await fetch(`/api/dpgf/${l.id}`, { method:"DELETE" });
    const d = await res.json();
    if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
    await load();
  }

  async function create() {
    setErr(null);
    const body = {
      code: add.code || null,
      description: add.description || "Ligne",
      unite: add.unite || null,
      qty: Number(add.qty || 0),
      unitPriceHt: Number(add.unit || 0),
    };
    const res = await fetch(`/api/marches/${id}/dpgf/lines`, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
    setAdd({ code:"", description:"", unite:"", qty:"0", unit:"0" });
    await load();
  }

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!rows) return <div className="p-6">Chargement…</div>;

  const total = useMemo(()=> rows.reduce((s,r)=> s + (r.totalHt||0), 0), [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="text-2xl font-bold">Édition DPGF — Marché #{id}</div>
        <div className="flex gap-2">
          <a className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50" href={`/imports/${id}`} target="_blank">Importer CSV</a>
          <a className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50" href={`/marches/${id}/budget`} target="_blank">Budget marché</a>
        </div>
      </div>

      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 w-20 text-left">Code</th>
              <th className="px-2 py-2 text-left">Désignation</th>
              <th className="px-2 py-2 w-20 text-left">Unité</th>
              <th className="px-2 py-2 w-24 text-right">Qté</th>
              <th className="px-2 py-2 w-28 text-right">PU HT</th>
              <th className="px-2 py-2 w-28 text-right">Total HT</th>
              <th className="px-2 py-2 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r)=>(
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1">
                  <input className="w-20 rounded border px-2 py-1" defaultValue={r.code||""}
                         onBlur={(e)=> save(r,{ code: e.target.value || null })}/>
                </td>
                <td className="px-2 py-1">
                  <input className="w-full rounded border px-2 py-1" defaultValue={r.description||""}
                         onBlur={(e)=> save(r,{ description: e.target.value || "" })}/>
                </td>
                <td className="px-2 py-1">
                  <input className="w-20 rounded border px-2 py-1" defaultValue={r.unite||""}
                         onBlur={(e)=> save(r,{ unite: e.target.value || null })}/>
                </td>
                <td className="px-2 py-1 text-right">
                  <input className="w-24 rounded border px-2 py-1 text-right" type="number" step="0.01" defaultValue={r.qty}
                         onBlur={(e)=> save(r,{ qty: Number(e.target.value||0) })}/>
                </td>
                <td className="px-2 py-1 text-right">
                  <input className="w-28 rounded border px-2 py-1 text-right" type="number" step="0.01" defaultValue={r.unitPriceHt}
                         onBlur={(e)=> save(r,{ unitPriceHt: Number(e.target.value||0) })}/>
                </td>
                <td className="px-2 py-1 text-right">{f(r.totalHt||0)}</td>
                <td className="px-2 py-1 text-right">
                  <button className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                          onClick={()=> remove(r)}
                          title={r.validatedHt>0 ? "Des validations existent — suppression bloquée" : "Supprimer"}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t">
            <tr>
              <td className="px-2 py-2 font-medium" colSpan={5}>Total DPGF</td>
              <td className="px-2 py-2 text-right font-semibold">{f(total)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded border p-4 bg-white">
        <div className="font-medium mb-2">Ajouter une ligne</div>
        <div className="grid md:grid-cols-6 gap-2">
          <input className="rounded border px-2 py-1" placeholder="Code" value={add.code} onChange={e=>setAdd({...add,code:e.target.value})}/>
          <input className="rounded border px-2 py-1 md:col-span-2" placeholder="Désignation" value={add.description} onChange={e=>setAdd({...add,description:e.target.value})}/>
          <input className="rounded border px-2 py-1" placeholder="Unité" value={add.unite} onChange={e=>setAdd({...add,unite:e.target.value})}/>
          <input className="rounded border px-2 py-1 text-right" type="number" step="0.01" placeholder="Qté" value={add.qty} onChange={e=>setAdd({...add,qty:e.target.value})}/>
          <input className="rounded border px-2 py-1 text-right" type="number" step="0.01" placeholder="PU HT" value={add.unit} onChange={e=>setAdd({...add,unit:e.target.value})}/>
        </div>
        <div className="mt-2">
          <button className="rounded bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700" onClick={create}>Ajouter</button>
          <a className="ml-2 rounded border px-3 py-1.5 text-sm hover:bg-slate-50" href={`/factures/nouvelle/${id}`} target="_blank">→ Créer facture</a>
        </div>
      </div>
    </div>
  );
}
