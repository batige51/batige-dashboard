"use client";
import { use, useEffect, useState } from "react";
import { COMPANY } from "@/app/config/company";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/pp/by-id/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) { setErr(d?.error || `Erreur ${res.status}`); return; }
      setData(d);
    })();
  }, [id]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Chargement…</div>;

  const h = data.header;
  const rows = data.rows || [];
  const t = data.totals || { total: 0, previous: 0, current: 0, remaining: 0 };

  return (
    <div className="p-6 print:p-0 print:bg-white">
      <div className="mb-4 flex gap-2 print:hidden">
        <button onClick={() => window.print()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Imprimer
        </button>
        <a href={`/validation/${h.facture.id}`} className="rounded border px-3 py-2 text-sm">
          Retour validation
        </a>
      </div>

      <div className="mx-auto max-w-5xl bg-white p-6 border rounded shadow print:shadow-none print:border-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xl font-bold">{COMPANY.name}</div>
            <div className="text-sm">{COMPANY.address}</div>
            {COMPANY.phone && <div className="text-sm">Tél. {COMPANY.phone}</div>}
            {COMPANY.email && <div className="text-sm">{COMPANY.email}</div>}
          </div>
          <div className="text-right">
            {COMPANY.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={COMPANY.logoUrl} alt="Logo" style={{ maxWidth: 160, maxHeight: 80 }} />
            ) : <div className="text-slate-400 text-sm">[Logo]</div>}
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-2xl font-bold">Proposition de Paiement (PP)</div>
          <div className="text-sm text-slate-600">
            {h.pp.numero} — Générée le {new Date(h.pp.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div className="rounded border p-3">
            <div><b>Projet</b> : {h.project.name}</div>
            <div><b>Marché</b> : {h.marche.reference}</div>
            <div><b>Entreprise</b> : {h.entreprise.name}</div>
          </div>
          <div className="rounded border p-3">
            <div><b>Facture</b> : {h.facture.numero}</div>
            <div><b>Date</b> : {new Date(h.facture.date).toLocaleDateString("fr-FR")}</div>
            <div><b>Statut</b> : {h.facture.statut}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded border">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-2 text-left w-24">Code</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-right w-28">Total HT</th>
                <th className="px-2 py-2 text-right w-28">Précédent</th>
                <th className="px-2 py-2 text-right w-28">Courant</th>
                <th className="px-2 py-2 text-right w-28">Restant</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.dpgfLineId} className="border-t">
                  <td className="px-2 py-1">{r.code || "-"}</td>
                  <td className="px-2 py-1">{r.description}</td>
                  <td className="px-2 py-1 text-right">{r.totalHt.toLocaleString("fr-FR")} €</td>
                  <td className="px-2 py-1 text-right">{r.previousHt.toLocaleString("fr-FR")} €</td>
                  <td className="px-2 py-1 text-right">{r.currentHt.toLocaleString("fr-FR")} €</td>
                  <td className="px-2 py-1 text-right">{r.remainingHt.toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t">
              <tr>
                <td className="px-2 py-2 font-medium" colSpan={2}>Totaux</td>
                <td className="px-2 py-2 text-right font-semibold">{t.total.toLocaleString("fr-FR")} €</td>
                <td className="px-2 py-2 text-right font-semibold">{t.previous.toLocaleString("fr-FR")} €</td>
                <td className="px-2 py-2 text-right font-semibold">{t.current.toLocaleString("fr-FR")} €</td>
                <td className="px-2 py-2 text-right font-semibold">{t.remaining.toLocaleString("fr-FR")} €</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 text-xs text-slate-600">
          Document figé. Toute nouvelle validation doit faire l’objet d’une nouvelle PP.
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: #fff !important; }
          a { text-decoration: none; color: inherit; }
        }
      `}</style>
    </div>
  );
}
