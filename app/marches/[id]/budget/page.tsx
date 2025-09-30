"use client";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/marches/${id}/budget`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
      setData(d);
    })();
  }, [id]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Chargement…</div>;

  const f = (n:number)=> (n||0).toLocaleString('fr-FR')+' €';

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-2xl font-bold">
            Budget marché — {data.marche.reference || data.marche.id}
          </div>
          <div className="text-sm text-slate-600">
            Projet : {data.project.name} • Entreprise : {data.entreprise.name}
          </div>
        </div>
        <a className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
           href={`/budget/${data.project.id}`}>← Budget projet</a>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Card title="Initial" value={f(data.initial)} />
        <Card title="Avenants ±" value={f(data.avenants)} />
        <Card title="Budget courant" value={f(data.courant)} />
        <Card title="Validé cumul" value={f(data.totals.cumul)} />
      </div>

      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left w-24">Code</th>
              <th className="px-2 py-2 text-left">Description</th>
              <th className="px-2 py-2 text-right w-28">Total HT</th>
              <th className="px-2 py-2 text-right w-28">Cumul validé</th>
              <th className="px-2 py-2 text-right w-28">Restant</th>
            </tr>
          </thead>
          <tbody>
            {(data.dpgf||[]).map((r:any)=>(
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1">{r.code || "-"}</td>
                <td className="px-2 py-1">{r.description || "-"}</td>
                <td className="px-2 py-1 text-right">{f(r.totalHt)}</td>
                <td className="px-2 py-1 text-right">{f(r.validatedHt)}</td>
                <td className="px-2 py-1 text-right">{f(r.remainingHt)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t">
            <tr>
              <td className="px-2 py-2 font-medium" colSpan={2}>Totaux</td>
              <td className="px-2 py-2 text-right">{f(data.totals.total)}</td>
              <td className="px-2 py-2 text-right">{f(data.totals.cumul)}</td>
              <td className="px-2 py-2 text-right">{f(data.totals.restant)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Card({title, value}:{title:string; value:string}) {
  return (
    <div className="rounded border p-4 bg-white">
      <div className="text-xs text-slate-600">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
