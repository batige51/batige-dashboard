"use client";

import { useEffect, useState } from "react";

type Props = {
  marcheId: number;
  open: boolean;
  onSaved: () => void; // appelé après sauvegarde OK
};

export default function RgProrataModal({ marcheId, open, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rgPct, setRgPct] = useState<number>(0);
  const [prorataPct, setProrataPct] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/marches/${marcheId}/rgprorata`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erreur chargement");
        setRgPct(Number(j.item?.rgPct ?? 0));
        setProrataPct(Number(j.item?.prorataPct ?? 0));
      } catch (e: any) {
        setMsg(e?.message || "Erreur chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, marcheId]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/marches/${marcheId}/rgprorata`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rgPct, prorataPct }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erreur");
      setMsg("Paramètres enregistrés ✅");
      setTimeout(() => onSaved(), 400);
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold">Paramétrage requis : RG & Prorata</h2>
        <p className="text-sm text-slate-600 mt-1">
          Indique les pourcentages pour ce devis. Ce paramétrage est obligatoire avant de continuer.
        </p>

        {loading ? (
          <div className="mt-5">Chargement…</div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rgPct">Retenue de garantie (RG) %</label>
              <input
                id="rgPct" type="number" step="0.01" min={0}
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={rgPct}
                onChange={(e)=>setRgPct(Number(e.target.value || 0))}
                placeholder="ex: 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="prorataPct">Prorata %</label>
              <input
                id="prorataPct" type="number" step="0.01" min={0}
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={prorataPct}
                onChange={(e)=>setProrataPct(Number(e.target.value || 0))}
                placeholder="ex: 2"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer et continuer"}
          </button>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
