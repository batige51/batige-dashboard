"use client";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [m, setM] = useState<any>(null);
  const [ref, setRef] = useState("");
  const [init, setInit] = useState("");
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function load() {
    setErr(null);
    const res = await fetch(`/api/marches/${id}`, { cache: "no-store" });
    const d = await res.json();
    if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
    setM(d); setRef(d.reference || ""); setInit(String(d.montantInitialHt || 0));
  }
  useEffect(()=>{ load(); },[id]);

  async function save() {
    setErr(null); setMsg(null);
    const res = await fetch(`/api/marches/${id}`, {
      method: "PATCH",
      headers: { "content-type":"application/json" },
      body: JSON.stringify({ reference: ref, montantInitialHt: Number(init||0) })
    });
    const d = await res.json();
    if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
    setMsg("Marché mis à jour"); setM(d);
  }

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!m) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="text-2xl font-bold">Éditer Marché #{id}</div>

      {msg && <div className="rounded border p-3 bg-emerald-50 border-emerald-300 text-emerald-800">{msg}</div>}

      <div className="rounded border p-4 bg-white grid md:grid-cols-2 gap-3">
        <label className="text-sm">
          Référence
          <input className="mt-1 w-full rounded border px-2 py-1" value={ref} onChange={e=>setRef(e.target.value)} />
        </label>
        <label className="text-sm">
          Montant initial HT
          <input className="mt-1 w-full rounded border px-2 py-1 text-right" type="number" step="0.01" value={init} onChange={e=>setInit(e.target.value)} />
        </label>
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Enregistrer</button>
        <a href={`/marches/${id}/dpgf-edit`} target="_blank" className="rounded border px-3 py-2 text-sm hover:bg-slate-50">DPGF</a>
        <a href={`/factures/nouvelle/${id}`} target="_blank" className="rounded border px-3 py-2 text-sm hover:bg-slate-50">Créer facture</a>
        <a href={`/marches/${id}/budget`} target="_blank" className="rounded border px-3 py-2 text-sm hover:bg-slate-50">Budget</a>
      </div>
    </div>
  );
}
