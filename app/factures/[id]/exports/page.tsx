"use client";
import { use } from "react";

export default function Page({ params }:{ params: Promise<{ id:string }> }) {
  const { id } = use(params);
  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-bold">Exports — Facture #{id}</div>
      <div className="rounded border bg-white p-4 space-y-2">
        <a
          className="inline-block rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          href={`/api/exports/factures/${id}`}
          target="_blank"
        >
          Télécharger Facture (CSV)
        </a>
        <div className="text-xs text-slate-600">
          Pour exporter la <b>PP</b> associée, utilise le lien sur la page PP (si générée), ou colle l’URL :
          <div className="mt-1 rounded bg-slate-50 border px-2 py-1 text-[11px]">
            /api/exports/pp/&lt;PP_ID&gt;
          </div>
        </div>
      </div>
    </div>
  );
}
