"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ImportSetupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const marcheId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rg, setRg] = useState<string>("");
  const [prorata, setProrata] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!marcheId) return;
    (async () => {
      try {
        const r = await fetch(`/api/marches/${marcheId}/rgprorata`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Erreur chargement");
        setRg(String(j?.item?.rgPct ?? 0));
        setProrata(String(j?.item?.prorataPct ?? 0));
      } catch (e: any) {
        setMsg(e?.message || "Erreur chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [marcheId]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`/api/marches/${marcheId}/rgprorata`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rgPct: Number(rg) || 0, prorataPct: Number(prorata) || 0 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Erreur enregistrement");
      setMsg("Paramètres enregistrés ✅");
      // Redirection vers la validation de facture du devis
      setTimeout(() => router.push(`/validation/${marcheId}`), 600);
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-xl mx-auto p-6">Chargement…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramétrage du devis</h1>
        <p className="text-slate-600 text-sm">
          Merci de renseigner <strong>RG %</strong> et <strong>Prorata %</strong>. Ces taux seront pris en compte
          automatiquement dans chaque Certificat de paiement (PP).
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Retenue de garantie (RG) %
          <input
            type="number"
            step="0.01"
            value={rg}
            onChange={(e)=>setRg(e.target.value)}
            className="mt-1 block w-40 border rounded-md px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium">
          Prorata %
          <input
            type="number"
            step="0.01"
            value={prorata}
            onChange={(e)=>setProrata(e.target.value)}
            className="mt-1 block w-40 border rounded-md px-3 py-2"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer et continuer"}
        </button>

        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>
    </div>
  );
}
