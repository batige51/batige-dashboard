"use client";
import { use, useEffect, useState } from "react";

type DpgfInfo = {
  id: number;
  code?: string | null;
  description?: string | null;
  totalHt: number;
};
type FactureLine = {
  id: number;
  dpgfLineId: number;
  requestedHt: number;
  validatedHt: number;
  dpgf: DpgfInfo;
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: factureId } = use(params);
  const [facture, setFacture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/factures/${factureId}`, { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
        setFacture(d);
      } catch (e: any) {
        setErr(e.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, [factureId]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!facture) return <div className="p-6">Facture introuvable.</div>;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-bold">Validation facture {facture.numero}</div>
        <div className="flex items-center gap-2">
          <a
            href={`/factures/${factureId}/print`}
            target="_blank"
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Imprimer la facture
          </a>
          <PpActions factureId={String(factureId)} />
        </div>
      </div>

      <div className="rounded border overflow-hidden">
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
            {(facture.lignes || []).map((l: FactureLine) => (
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
    </div>
  );
}

/** Bouton Générer/Ouvrir PP (persistée) */
function PpActions({ factureId }: { factureId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "haspp">("idle");
  const [ppId, setPpId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function commit() {
    setState("busy");
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/pp/commit/${factureId}`, { method: "POST" });
      const d = await res.json();
      if (res.status === 409 && d.ppId) {
        setPpId(d.ppId);
        setState("haspp");
        setMsg("PP déjà existante — impression disponible.");
        return;
      }
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setPpId(d.id);
      setState("haspp");
      setMsg(`PP créée : ${d.numero}`);
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
      setState("idle");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {err && <span className="text-red-600 text-sm">{err}</span>}
      {msg && <span className="text-green-700 text-sm">{msg}</span>}

      {state !== "haspp" ? (
        <button
          onClick={commit}
          disabled={state === "busy"}
          className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {state === "busy" ? "Génération…" : "Générer PP"}
        </button>
      ) : (
        <a
          href={`/pp-fixed/${ppId}/print`}
          target="_blank"
          className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Ouvrir PP figée
        </a>
      )}
    </div>
  );
}
