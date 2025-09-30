"use client";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/budget/${id}`, { cache: "no-store" });
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
      <div className="text-2xl font-bold">Budget — {data.project.name}</div>

      <div className="grid md:grid-cols-5 gap-3">
        <Card title="Initial" value={f(data.totaux.initial)} />
        <Card title="Avenants ±" value={f(data.totaux.avenants)} />
        <Card title="Budget courant" value={f(data.totaux.courant)} />
        <Card title="Validé (cumul)" value={f(data.totaux.valide)} />
        <Card title="Restant" value={f(data.totaux.restant)} />
      </div>

      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">Marché</th>
              <th className="px-2 py-2 text-right">Initial</th>
              <th className="px-2 py-2 text-right">Avenants</th>
              <th className="px-2 py-2 text-right">Budget courant</th>
              <th className="px-2 py-2 text-right">Validé</th>
              <th className="px-2 py-2 text-right">Restant</th>
            </tr>
          </thead>
          <tbody>
            {(data.marches||[]).map((m:any)=>(
              <tr key={m.id} className="border-t">
                <td className="px-2 py-1">{m.reference || m.id}</td>
                <td className="px-2 py-1 text-right">{f(m.totalInitial)}</td>
                <td className="px-2 py-1 text-right">{f(m.avenantDelta)}</td>
                <td className="px-2 py-1 text-right">{f(m.budgetCourant)}</td>
                <td className="px-2 py-1 text-right">{f(m.valideCumul)}</td>
                <td className="px-2 py-1 text-right">{f(m.restant)}</td>
              </tr>
            ))}
          </tbody>
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
