"use client";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetch(`/api/projects/${id}/budget`, { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
        setData(d);
      } catch (e:any) {
        setErr(e.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Aucune donnée</div>;

  const t = data.totals || { totalDPGF:0, validatedCumul:0, remaining:0, factureDemande:0, factureValide:0 };
  const fmt = (n:number)=> n.toLocaleString("fr-FR")+" €";

  return (
    <div className="p-6 space-y-6">
      <div className="text-xl font-bold">Budget — Projet #{data.projectId}</div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Budget total (DPGF)" value={fmt(t.totalDPGF)} />
        <Card title="Validé (cumul)" value={fmt(t.validatedCumul)} />
        <Card title="Restant" value={fmt(t.remaining)} />
        <Card title="Factures validées" value={fmt(t.factureValide)} />
      </div>

      {/* Tableau par marché */}
      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">Marché</th>
              <th className="px-2 py-2 text-left">Entreprise</th>
              <th className="px-2 py-2 text-right">DPGF HT</th>
              <th className="px-2 py-2 text-right">Validé cumul</th>
              <th className="px-2 py-2 text-right">Restant</th>
              <th className="px-2 py-2 text-right">Fact. validées</th>
            </tr>
          </thead>
          <tbody>
            {(data.rows||[]).map((r:any)=>(
              <tr key={r.marcheId} className="border-t">
                <td className="px-2 py-1">{r.marcheRef}</td>
                <td className="px-2 py-1">{r.entreprise}</td>
                <td className="px-2 py-1 text-right">{fmt(r.totalDPGF)}</td>
                <td className="px-2 py-1 text-right">{fmt(r.validatedCumul)}</td>
                <td className="px-2 py-1 text-right">{fmt(r.remaining)}</td>
                <td className="px-2 py-1 text-right">{fmt(r.factureValide)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t">
            <tr>
              <td className="px-2 py-2 font-medium" colSpan={2}>Totaux</td>
              <td className="px-2 py-2 text-right font-semibold">{fmt(t.totalDPGF)}</td>
              <td className="px-2 py-2 text-right font-semibold">{fmt(t.validatedCumul)}</td>
              <td className="px-2 py-2 text-right font-semibold">{fmt(t.remaining)}</td>
              <td className="px-2 py-2 text-right font-semibold">{fmt(t.factureValide)}</td>
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
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
