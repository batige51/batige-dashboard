"use client";
import { use } from "react";

export default function Page({ params }:{ params: Promise<{ id:string }> }) {
  const { id } = use(params);
  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-bold">Exports — Marché #{id}</div>
      <div className="rounded border bg-white p-4 space-y-2">
        <a
          className="inline-block rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          href={`/api/exports/marches/${id}/dpgf`}
          target="_blank"
        >
          Télécharger DPGF (CSV)
        </a>
      </div>
    </div>
  );
}
