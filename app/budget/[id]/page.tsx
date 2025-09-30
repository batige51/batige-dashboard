"use client";
import { use, useEffect, useState } from "react";

type Row = {
  marcheId: number;
  entreprise: string;
  reference: string;
  initialHt: number;
  dpgfTotalHt: number;
  deltaAvenants: number;
  revisedHt: number;
  validatedHt: number;
  remainingHt: number;
  progress: number;
};

export default function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/budget/${projectId}`, { cache: "no-store" });
      const d = await res.json();
      setData(d); setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!data?.marches) return <div className="p-6 text-red-600">Budget introuvable.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Budget — Projet #{data.projectId}</h1>

      <div className="grid gap-4 md:grid-cols-7">
        <Kpi title="Budget initial" value={data.totals.initialHt} />
        <Kpi title="DPGF total" value={data.totals.dpgfTotalHt} />
        <Kpi title="Avenants (validés)" value={data.totals.deltaAvenants} />
        <Kpi title="Coûts révisés" value={data.totals.revisedHt} />
        <Kpi title="Déjà validé" value={data.totals.validatedHt} />
        <Kpi title="Ventes (HT)" value={data.totals.ventesHt} />
        <Kpi title="Marge (HT)" value={data.totals.marge} />
      </div>

      <div className="rounded border bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">Marché</th>
              <th className="px-3 py-2">Entreprise</th>
              <th className="px-3 py-2 text-right">Initial</th>
              <th className="px-3 py-2 text-right">DPGF</th>
              <th className="px-3 py-2 text-right">Avenants</th>
              <th className="px-3 py-2 text-right">Révisé</th>
              <th className="px-3 py-2 text-right">Validé</th>
              <th className="px-3 py-2 text-right">Restant</th>
              <th className="px-3 py-2 text-right">Avancement</th>
            </tr>
          </thead>
          <tbody>
            {data.marches.map((r: Row) => (
              <tr key={r.marcheId} className="border-t">
                <td className="px-3 py-2">{r.reference}</td>
                <td className="px-3 py-2">{r.entreprise}</td>
                <td className="px-3 py-2 text-right">{r.initialHt.toLocaleString("fr-FR")} €</td>
                <td className="px-3 py-2 text-right">{r.dpgfTotalHt.toLocaleString("fr-FR")} €</td>
                <td className="px-3 py-2 text-right">{r.deltaAvenants.toLocaleString("fr-FR")} €</td>
                <td className="px-3 py-2 text-right font-medium">{r.revisedHt.toLocaleString("fr-FR")} €</td>
                <td className="px-3 py-2 text-right">{r.validatedHt.toLocaleString("fr-FR")} €</td>
                <td className="px-3 py-2 text-right">{r.remainingHt.toLocaleString("fr-FR")} €</td>
                <td className="px-3 py-2 text-right">{(r.progress * 100).toFixed(1)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-xl font-semibold">{(value || 0).toLocaleString("fr-FR")} €</div>
    </div>
  );
}
