"use client";

import { useState } from "react";

export default function ImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!file) {
      setMsg("Choisis un fichier à importer.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      // ⚠️ ADAPTE le chemin si ta route d'import est différente
      const r = await fetch("/api/imports/marches", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Import échoué");

      // On récupère l'id du devis créé/concerné par l'import
      const marcheId =
        j?.marcheId ?? j?.id ?? j?.item?.id ?? j?.marche?.id ?? j?.data?.marcheId;
      if (!marcheId) throw new Error("Import OK mais marcheId absent dans la réponse");

      // ✅ Redirection immédiate vers la page de paramétrage RG/PRORATA
      window.location.href = `/imports/setup/${marcheId}`;
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Importer un devis / DPGF</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          className="block w-full border rounded-md px-3 py-2"
          onChange={(e)=>setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={busy || !file}
          className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Import en cours…" : "Importer"}
        </button>
        {msg && <div className="text-sm text-red-600">{msg}</div>}
      </form>
    </div>
  );
}
