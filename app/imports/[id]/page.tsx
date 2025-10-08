"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function ImportForMarchePage() {
  const { id } = useParams<{ id: string }>();
  const marcheId = Number(id);

  const [file, setFile] = useState<File | null>(null);
  const [clearing, setClearing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!file) { setMsg("Choisis un fichier."); return; }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/marches/${marcheId}/dpgf/import?clear=${clearing ? "1" : "0"}`, {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Import échoué");

      // ✅ Redirection immédiate vers le paramétrage RG/PRORATA
      window.location.href = `/imports/setup/${marcheId}`;
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Import — Devis #{marcheId}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} className="block w-full border rounded-md px-3 py-2"/>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={clearing} onChange={(e)=>setClearing(e.target.checked)} />
          Vider avant import
        </label>
        <button type="submit" disabled={busy || !file} className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 disabled:opacity-50">
          {busy ? "Import…" : "Importer"}
        </button>
        {msg && <div className="text-sm text-red-600">{msg}</div>}
      </form>
    </div>
  );
}
