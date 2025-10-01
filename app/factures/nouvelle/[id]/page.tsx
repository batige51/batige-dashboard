"use client";
import { useEffect, useMemo, useState, use } from "react";

type MarcheInfo = {
  id: number;
  reference?: string | null;
  project?: { id: number; name: string };
  entreprise?: { id: number; name: string };
};
type DpgfLine = {
  id: number;
  code?: string | null;
  description?: string | null;
  totalHt: number;
  validatedHt: number;
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // id = marché
  const [marche, setMarche] = useState<MarcheInfo | null>(null);
  const [lignes, setLignes] = useState<DpgfLine[]>([]);
  const [numero, setNumero] = useState("");
  const [req, setReq] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        // 1) Infos marché basiques
        const mres = await fetch(`/api/marches/${id}`, { cache: "no-store" });
        const md = await mres.json();
        if (!mres.ok) throw new Error(md?.error || `Marche ${id} introuvable`);
        setMarche({ id: md.id, reference: md.reference, project: md.project, entreprise: md.entreprise });

        // 2) DPGF du marché
        const dres = await fetch(`/api/marches/${id}/dpgf`, { cache: "no-store" });
        const dd = await dres.json();
        if (!dres.ok) throw new Error(dd?.error || `DPGF indisponible`);
        const map = dd.map((x: any) => ({
          id: x.id,
          code: x.code,
          description: x.description,
          totalHt: x.totalHt || 0,
          validatedHt: x.validatedHt || 0,
        }));
        setLignes(map);

        // init inputs à 0
        const init: Record<number, string> = {};
        map.forEach((l: DpgfLine) => (init[l.id] = "0"));
        setReq(init);
      } catch (e: any) {
        setErr(e.message || "Erreur chargement");
      }
    })();
  }, [id]);

  const totalDemande = useMemo(() => {
    return Object.values(req).reduce((s, v) => {
      const n = parseFloat(v || "0");
      return s + (isFinite(n) ? n : 0);
    }, 0);
  }, [req]);

  async function createFacture() {
    if (!marche) return;
    setBusy(true); setErr(null); setOkMsg(null);
    try {
      // On a besoin de projectId / entrepriseId pour l’API POST /api/factures
      // On suppose que /api/marches/[id] renvoie { projectId, entrepriseId } dans ton implémentation.
      // Si non, on fait un fetch ciblé :
      const mr = await fetch(`/api/marches/${id}`, { cache: "no-store" });
      const md = await mr.json();
      if (!mr.ok) throw new Error(md?.error || `Marché ${id} introuvable`);

      const body = {
        projectId: md.projectId,
        entrepriseId: md.entrepriseId,
        marcheId: Number(id),
        numero: numero.trim() || `F-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        lines: Object.entries(req)
          .map(([dpgfLineId, requestedHt]) => ({
            dpgfLineId: Number(dpgfLineId),
            requestedHt: parseFloat(requestedHt || "0") || 0,
          }))
          .filter((l) => l.requestedHt > 0),
      };

      if (body.lines.length === 0) throw new Error("Aucune ligne demandée (> 0 €)");

      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);

      setOkMsg(`Facture créée (#${d.id})`);
      // Ouvre la page de validation
      window.location.href = `/validation/${d.id}`;
    } catch (e: any) {
      setErr(e.message || "Erreur création facture");
    } finally {
      setBusy(false);
    }
  }

  const f = (n: number) => (n || 0).toLocaleString("fr-FR") + " €";

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!marche) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="text-2xl font-bold">Nouvelle facture — Marché {marche.reference || marche.id}</div>
      <div className="text-sm text-slate-600">
        Projet : {marche.project?.name || "-"} • Entreprise : {marche.entreprise?.name || "-"}
      </div>

      {(okMsg) && <div className="rounded border p-3 bg-emerald-50 border-emerald-300 text-emerald-800">{okMsg}</div>}

      <div className="rounded border p-4 bg-white grid md:grid-cols-3 gap-2">
        <input
          className="rounded border px-2 py-1"
          placeholder="Numéro de facture (ex: F-2025-001)"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
        <div className="text-sm text-slate-600 col-span-2 self-center">
          Laisse vide pour générer automatiquement un numéro unique.
        </div>
      </div>

      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left w-24">Code</th>
              <th className="px-2 py-2 text-left">Description</th>
              <th className="px-2 py-2 text-right w-28">Total HT</th>
              <th className="px-2 py-2 text-right w-28">Déjà validé</th>
              <th className="px-2 py-2 text-right w-32">Demandé HT</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => {
              const restant = Math.max(0, (l.totalHt || 0) - (l.validatedHt || 0));
              const disabled = restant <= 0;
              return (
                <tr key={l.id} className={`border-t ${disabled ? "opacity-50" : ""}`}>
                  <td className="px-2 py-1">{l.code || "-"}</td>
                  <td className="px-2 py-1">{l.description || "-"}</td>
                  <td className="px-2 py-1 text-right">{f(l.totalHt || 0)}</td>
                  <td className="px-2 py-1 text-right">{f(l.validatedHt || 0)}</td>
                  <td className="px-2 py-1 text-right">
                    <input
                      className="w-28 rounded border px-2 py-1 text-right"
                      type="number"
                      min={0}
                      max={restant}
                      step="0.01"
                      disabled={disabled}
                      value={req[l.id] ?? "0"}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(restant, parseFloat(e.target.value || "0") || 0));
                        setReq((s) => ({ ...s, [l.id]: String(v) }));
                      }}
                      title={disabled ? "Ligne soldée" : `Max: ${restant.toLocaleString("fr-FR")} €`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t">
            <tr>
              <td className="px-2 py-2 font-medium" colSpan={4}>Total demandé</td>
              <td className="px-2 py-2 text-right font-semibold">
                {totalDemande.toLocaleString("fr-FR")} €
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          onClick={createFacture}
          disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Création…" : "Créer la facture"}
        </button>
        <a
          href={`/marches/${id}/budget`}
          target="_blank"
          className="rounded border px-3 py-2 text-sm hover:bg-slate-50"
        >
          Budget du marché
        </a>
      </div>
    </div>
  );
}
