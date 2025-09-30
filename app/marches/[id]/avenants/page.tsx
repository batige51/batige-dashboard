"use client";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rows, setRows] = useState<any[]|null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/marches/${id}/avenants`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
      setRows(d);
    })();
  }, [id]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!rows) return <div className="p-6">Chargement…</div>;

  const f = (n:number)=> (n||0).toLocaleString("fr-FR")+" €";

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="text-2xl font-bold">Avenants — Marché #{id}</div>
        <a className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50" href={`/avenants/nouveau/${id}`} target="_blank">
          + Nouvel avenant
        </a>
      </div>

      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">Numéro</th>
              <th className="px-2 py-2 text-left">Statut</th>
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-right">Δ HT total</th>
              <th className="px-2 py-2 text-right"># lignes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any)=>(
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1">{r.numero}</td>
                <td className="px-2 py-1">{r.statut}</td>
                <td className="px-2 py-1">{new Date(r.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-2 py-1 text-right">{f(r.deltaHt)}</td>
                <td className="px-2 py-1 text-right">{r.lines}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-600">
        Les montants d’avenants impactent le <b>Budget courant</b> (pages Budget projet & Budget marché).
      </div>
    </div>
  );
}
