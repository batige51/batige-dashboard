"use client";
import { use, useEffect, useMemo, useState } from "react";
import { COMPANY } from "@/app/config/company";

export default function Page({ params }:{ params: Promise<{ id:string }> }) {
  const { id } = use(params);
  const [vente, setVente] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(()=> {
    (async()=>{
      try {
        const res = await fetch(`/api/ventes/${id}`, { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
        setVente(d);
      } catch(e:any) {
        setErr(e.message || "Erreur inconnue");
      }
    })();
  }, [id]);

  const totals = useMemo(()=>{
    if (!vente) return null;
    const htBase = vente.prixVenteHt || 0;
    const tma = vente.tmaTotalHt || 0;
    const ht = htBase + tma;
    const tva = ht * ((vente.tvaRate || 0)/100);
    const ttc = ht + tva;
    return { htBase, tma, ht, tva, ttc };
  }, [vente]);

  const fmt = (n:number)=> n.toLocaleString("fr-FR")+" €";

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!vente || !totals) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 print:p-0 print:bg-white">
      <div className="mb-4 flex gap-2 print:hidden">
        <button onClick={()=>window.print()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Imprimer</button>
        <a href={`/ventes/${id}`} className="rounded border px-3 py-2 text-sm">Retour</a>
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
          <div className="text-2xl font-bold">Vente actée — Lot {vente.lot?.numero}</div>
          <div className="text-sm text-slate-600">
            Client {vente.client} — {new Date(vente.date).toLocaleDateString("fr-FR")}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-sm mb-6">
          <div className="rounded border p-3">
            <div><b>Typologie</b> : {vente.lot?.typologie || "-"}</div>
            <div><b>Surface</b> : {vente.lot?.surface ?? "-"} m²</div>
            <div><b>Prix catalogue HT</b> : {fmt(vente.lot?.prixCatalogueHt || 0)}</div>
          </div>
          <div className="rounded border p-3">
            <div><b>Prix vente HT</b> : {fmt(vente.prixVenteHt || 0)}</div>
            <div><b>TMA (±)</b> : {fmt(vente.tmaTotalHt || 0)}</div>
            <div><b>Total HT</b> : {fmt(totals.ht)}</div>
            <div><b>TVA ({(vente.tvaRate||0).toLocaleString("fr-FR")}%)</b> : {fmt(totals.tva)}</div>
            <div><b>Total TTC</b> : <b>{fmt(totals.ttc)}</b></div>
          </div>
        </div>

        <div className="rounded border overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-2 text-left w-24">Code</th>
                <th className="px-2 py-2 text-left">Description TMA</th>
                <th className="px-2 py-2 text-right w-28">Delta HT</th>
              </tr>
            </thead>
            <tbody>
              {(vente.tmas||[]).map((t:any)=>(
                <tr key={t.id} className="border-t">
                  <td className="px-2 py-1">{t.code || "-"}</td>
                  <td className="px-2 py-1">{t.description}</td>
                  <td className="px-2 py-1 text-right">{(t.deltaHt||0).toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
              {(!vente.tmas || vente.tmas.length===0) && (
                <tr><td className="px-2 py-2" colSpan={3}>Aucune TMA</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-xs text-slate-600">
          Document non contractuel — récapitulatif des TMA et montants associés.
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

