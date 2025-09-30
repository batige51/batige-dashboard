"use client";
import { use, useEffect, useMemo, useState } from "react";

/** Types minimaux pour l’écran */
type Dpgf = {
  id: number;
  code?: string | null;
  description?: string | null;
  totalHt: number;
  validatedHt: number; // cumul toutes factures (incluant éventuellement cette facture si déjà saisie)
};
type FactureLine = {
  id: number;
  dpgfLineId: number;
  requestedHt: number | null;
  validatedHt: number | null;
  dpgf: Dpgf | null;
};
type Facture = {
  id: number;
  numero: string;
  date: string;
  statut: string;
  project?: { id: number; name: string };
  marche?: { id: number; reference?: string | null };
  entreprise?: { id: number; name: string };
  lignes: FactureLine[];
  pp?: { id: number; numero: string } | null;
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);                 // Next 15: params est une Promise
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // inputs par ligne de facture (valeur validée que l’on saisit)
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  // état “Générer PP”
  const [ppBusy, setPpBusy] = useState(false);
  const [ppMsg, setPpMsg] = useState<string | null>(null);
  const [ppErr, setPpErr] = useState<string | null>(null);

  function fmtE(n: number) {
    return (n || 0).toLocaleString("fr-FR") + " €";
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/factures/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setFacture(d);
      // initialise les champs avec “déjà validé” s’il existe, sinon “demandé”
      const next: Record<number, string> = {};
      (d.lignes || []).forEach((fl: FactureLine) => {
        const base = (fl.validatedHt ?? fl.requestedHt ?? 0);
        next[fl.id] = String(base);
      });
      setInputs(next);
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const totals = useMemo(() => {
    if (!facture) return { requested: 0, validated: 0 };
    const requested = facture.lignes.reduce((s, l) => s + (l.requestedHt || 0), 0);
    const validated = Object.entries(inputs).reduce((s, [k, v]) => {
      const n = parseFloat(v || "0"); return s + (isFinite(n) ? n : 0);
    }, 0);
    return { requested, validated };
  }, [facture, inputs]);

  // borne la saisie entre 0 et “safeMax” (anti-dépassement côté UI)
  function clampForLine(fl: FactureLine, raw: string): string {
    const d = fl.dpgf!;
    const val = parseFloat(raw || "0");
    if (!isFinite(val) || val < 0) return "0";

    // cumul “autres lignes” = dpgf.validatedHt (toutes factures) - ce qui est déjà validé sur CETTE ligne de facture
    const otherCumul = (d.validatedHt || 0) - (fl.validatedHt || 0);
    const safeMax = Math.max(0, (d.totalHt || 0) - otherCumul); // limite théorique autorisée pour cette saisie
    return String(Math.min(val, safeMax));
  }

  // Envoi au serveur (A.1) qui revalide durement et met à jour cumul
  async function saveValidations() {
    if (!facture) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        lines: (facture.lignes || []).map((fl) => ({
          factureLineId: fl.id,
          validatedHt: parseFloat(inputs[fl.id] || "0") || 0,
        })),
      };
      const res = await fetch(`/api/factures/${facture.id}/validate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      await load(); // recharge pour voir les cumuls mis à jour
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // Génère/fige la PP (B.1) puis ouvre l’impression
  async function generatePP() {
    if (!facture) return;
    setPpBusy(true); setPpErr(null); setPpMsg(null);
    try {
      const res = await fetch(`/api/pp/commit/${facture.id}`, { method: "POST" });
      const d = await res.json();
      if (res.status === 409 && d?.ppId) {
        setPpMsg("PP déjà existante — ouverture de l’impression.");
        window.open(`/pp-fixed/${d.ppId}/print`, "_blank");
        return;
      }
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setPpMsg(`PP créée : ${d.numero}`);
      window.open(`/pp-fixed/${d.id}/print`, "_blank");
      await load(); // la facture est désormais figée pour la validation
    } catch (e: any) {
      setPpErr(e.message || "Erreur PP");
    } finally {
      setPpBusy(false);
    }
  }

  if (loading) return <div className="p-6">Chargement…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!facture) return <div className="p-6">Facture introuvable</div>;

  const factureFigee = !!facture.pp; // s’il y a déjà une PP, on fige la saisie

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold">Validation — Facture {facture.numero}</div>
          <div className="text-sm text-slate-600">
            {new Date(facture.date).toLocaleDateString("fr-FR")} • Statut: {facture.statut}<br/>
            Projet: {facture.project?.name || "-"} • Marché: {facture.marche?.reference || "-"} • Entreprise: {facture.entreprise?.name || "-"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveValidations}
            disabled={saving || factureFigee}
            className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
            title={factureFigee ? "Facture figée (PP existante)" : "Enregistrer la validation"}
          >
            {saving ? "Enregistrement…" : "Enregistrer la validation"}
          </button>
          <button
            onClick={generatePP}
            disabled={ppBusy}
            className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {ppBusy ? "Génération PP…" : "Générer PP"}
          </button>
        </div>
      </div>

      {(ppMsg || ppErr) && (
        <div className={`rounded border p-3 ${ppErr ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
          {ppErr || ppMsg}
        </div>
      )}

      {/* Tableau des lignes */}
      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left w-24">Code</th>
              <th className="px-2 py-2 text-left">Description</th>
              <th className="px-2 py-2 text-right w-28">Total HT</th>
              <th className="px-2 py-2 text-right w-28">Cumul validé</th>
              <th className="px-2 py-2 text-right w-28">Demandé HT</th>
              <th className="px-2 py-2 text-right w-32">Validé HT (saisie)</th>
              <th className="px-2 py-2 text-right w-28">Restant (après)</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((fl) => {
              const d = fl.dpgf!;
              const otherCumul = (d.validatedHt || 0) - (fl.validatedHt || 0);
              const safeMax = Math.max(0, (d.totalHt || 0) - otherCumul);
              const raw = inputs[fl.id] ?? "0";
              const clamped = parseFloat(clampForLine(fl, raw));
              const locked = safeMax <= 0 || factureFigee;
              const remainingAfter = Math.max(0, (d.totalHt || 0) - otherCumul - clamped);

              return (
                <tr key={fl.id} className={`border-t ${locked ? "opacity-50" : ""}`}>
                  <td className="px-2 py-1">{d.code || "-"}</td>
                  <td className="px-2 py-1">{d.description || "-"}</td>
                  <td className="px-2 py-1 text-right">{fmtE(d.totalHt || 0)}</td>
                  <td className="px-2 py-1 text-right">{fmtE(d.validatedHt || 0)}</td>
                  <td className="px-2 py-1 text-right">{fmtE(fl.requestedHt || 0)}</td>
                  <td className="px-2 py-1 text-right">
                    <input
                      className="w-28 rounded border px-2 py-1 text-right"
                      type="number"
                      step="0.01"
                      value={inputs[fl.id] ?? "0"}
                      disabled={locked}
                      onChange={(e) => {
                        const next = clampForLine(fl, e.target.value);
                        setInputs((s) => ({ ...s, [fl.id]: next }));
                      }}
                      title={locked ? "Ligne soldée ou facture figée" : `Max autorisé: ${safeMax.toLocaleString("fr-FR")} €`}
                    />
                  </td>
                  <td className="px-2 py-1 text-right">{fmtE(remainingAfter)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t">
            <tr>
              <td className="px-2 py-2 font-medium" colSpan={4}>Totaux</td>
              <td className="px-2 py-2 text-right">{fmtE(totals.requested)}</td>
              <td className="px-2 py-2 text-right font-semibold">{fmtE(totals.validated)}</td>
              <td className="px-2 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-xs text-slate-600">
        Astuce : si une ligne est déjà **soldée** (plus de restant), elle est affichée en grisé et non éditable.
        La règle anti-dépassement est appliquée **côté écran** et **côté serveur**.
      </div>
    </div>
  );
}
