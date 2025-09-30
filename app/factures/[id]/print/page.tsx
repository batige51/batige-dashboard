"use client";
import { use, useEffect, useMemo, useState } from "react";
import { COMPANY } from "@/app/config/company";

type Facture = {
  id: number;
  numero: string;
  date: string;
  statut: string;
  tvaRate: number;     // ex: 20
  retenuePct: number;  // ex: 5
  isDgd: boolean;
  project?: { name: string };
  marche?: { reference: string };
  entreprise?: { name: string };
  lignes: Array<{
    id: number;
    requestedHt: number | null;
    validatedHt: number | null;
    dpgf?: { code?: string | null; description?: string | null };
  }>;
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/factures/${id}`, { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
        setFacture(d);
      } catch (e: any) {
        setErr(e.message || "Erreur inconnue");
      }
    })();
  }, [id]);

  const totals = useMemo(() => {
    if (!facture) return null;
    const totalHT = (facture.lignes || []).reduce((s, l) => s + (l.validatedHt ?? l.requestedHt ?? 0), 0);
    const tva = totalHT * ((facture.tvaRate ?? 0) / 100);
    const ttc = totalHT + tva;

    // Retenue de garantie (si pas DGD)
    const rgPct = facture.isDgd ? 0 : (facture.retenuePct ?? 0);
    const rg = totalHT * (rgPct / 100);
    const netAPayer = ttc - rg;

    return { totalHT, tva, ttc, rgPct, rg, netAPayer };
  }, [facture]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!facture || !totals) return <div className="p-6">Chargement…</div>;

  const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";

  return (
    <div className="p-6 print:p-0 print:bg-white">
      <div className="mb-4 flex gap-2 print:hidden">
        <button onClick={() => window.print()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Imprimer
        </button>
      </div>

      <div className="mx-auto max-w-5xl bg-white p-6 border rounded shadow print:shadow-none print:border-0">
        {/* En-tête */}
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
            ) : (
              <div className="text-slate-400 text-sm">[Logo]</div>
            )}
          </div>
        </div>

        {/* Titre + méta */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div className="rounded border p-3">
            <div className="text-lg font-semibold">Facture {facture.numero}</div>
            <div><b>Date</b> : {new Date(facture.date).toLocaleDateString("fr-FR")}</div>
            <div><b>Statut</b> : {facture.statut}</div>
          </div>
          <div className="rounded border p-3">
            <div><b>Projet</b> : {facture.project?.name}</div>
            <div><b>Marché</b> : {facture.marche?.reference}</div>
            <div><b>Entreprise</b> : {facture.entreprise?.name}</div>
          </div>
        </div>

        {/* Tableau lignes */}
        <div className="overflow-hidden rounded border">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-2 text-left w-24">Code</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-right w-28">Demandé HT</th>
                <th className="px-2 py-2 text-right w-28">Validé HT</th>
              </tr>
            </thead>
            <tbody>
              {(facture.lignes || []).map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-2 py-1">{l.dpgf?.code || "-"}</td>
                  <td className="px-2 py-1">{l.dpgf?.description || "-"}</td>
                  <td className="px-2 py-1 text-right">{(l.requestedHt || 0).toLocaleString("fr-FR")} €</td>
                  <td className="px-2 py-1 text-right">{(l.validatedHt ?? 0).toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux PRO */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded border p-3 text-sm">
            <div className="font-semibold mb-2">Totaux</div>
            <div className="flex justify-between border-b py-1">
              <span>Total HT</span><span className="font-semibold">{fmt(totals.totalHT)}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span>TVA ({facture.tvaRate.toLocaleString("fr-FR")}%)</span>
              <span className="font-semibold">{fmt(totals.tva)}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span>Total TTC</span><span className="font-semibold">{fmt(totals.ttc)}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span>Retenue de garantie ({totals.rgPct.toLocaleString("fr-FR")}%)</span>
              <span className="font-semibold">− {fmt(totals.rg)}</span>
            </div>
            <div className="flex justify-between py-1 text-lg">
              <span>Net à payer</span><span className="font-bold">{fmt(totals.netAPayer)}</span>
            </div>
          </div>

          <div className="rounded border p-3 text-sm">
            <div className="font-semibold mb-2">Règlement</div>
            <div><b>Titulaire</b> : {COMPANY.rib.titulaire}</div>
            <div><b>Banque</b> : {COMPANY.rib.banque}</div>
            <div><b>IBAN</b> : {COMPANY.rib.iban}</div>
            <div><b>BIC</b> : {COMPANY.rib.bic}</div>

            <div className="font-semibold mt-4 mb-2">Mentions</div>
            <div className="text-xs text-slate-600">
              <div>{COMPANY.conditions.paiement}</div>
              <div>{COMPANY.conditions.rg}</div>
              <div>{COMPANY.conditions.penalites}</div>
              <div className="mt-2">
                SIRET {COMPANY.legal.siret} — TVA {COMPANY.legal.tvaIntracom} — Capital {COMPANY.legal.capital}
              </div>
            </div>
          </div>
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
