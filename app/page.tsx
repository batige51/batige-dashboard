"use client";
import { useEffect, useState } from "react";

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border bg-white p-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/summary", { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
        setData(d);
      } catch (e: any) {
        setErr(e.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Aucune donnée</div>;

  const t = data.totals || { dpTotal: 0, dpValid: 0, dpRest: 0, factVal: 0, projects: 0, markets: 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="text-2xl font-bold">Tableau de bord</div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card title="Projets" value={String(t.projects)} />
        <Card title="Marchés" value={String(t.markets)} />
        <Card title="Budget DPGF" value={fmt(t.dpTotal)} />
        <Card title="Validé" value={fmt(t.dpValid)} />
        <Card title="Restant" value={fmt(t.dpRest)} />
        <Card title="Factures validées" value={fmt(t.factVal)} />
      </div>

      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">Projet</th>
              <th className="px-2 py-2 text-right">DPGF HT</th>
              <th className="px-2 py-2 text-right">Validé</th>
              <th className="px-2 py-2 text-right">Restant</th>
              <th className="px-2 py-2 text-right">Factures validées</th>
              <th className="px-2 py-2 text-right"># Marchés</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data.rows || []).map((r: any) => (
              <tr key={r.projectId} className="border-t">
                <td className="px-2 py-1">{r.projectName}</td>
                <td className="px-2 py-1 text-right">{fmt(r.dpTotal)}</td>
                <td className="px-2 py-1 text-right">{fmt(r.dpValid)}</td>
                <td className="px-2 py-1 text-right">{fmt(r.dpRest)}</td>
                <td className="px-2 py-1 text-right">{fmt(r.factVal)}</td>
                <td className="px-2 py-1 text-right">{r.markets}</td>
                <td className="px-2 py-1 text-right">
                  <a className="rounded border px-2 py-1 hover:bg-slate-50 text-xs" href={`/projects/${r.projectId}/budget`}>
                    Ouvrir budget
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
