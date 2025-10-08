"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Line = {
  id: number;
  code?: string | null;
  description: string;
  totalHt: number;
  validatedHt: number;
  remainingHt: number;
};

type MarcheInfo = {
  id: number;
  reference?: string | null;
  project: { id: number; name: string };
  entreprise: { id: number; name: string };
  dpgf: Line[];
};

type PPItem = { id: number; label: string; totalHt: number };

const eur = (n: number) => (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const marcheId = Number(id);
  const router = useRouter();

  const [marche, setMarche] = useState<MarcheInfo | null>(null);
  const [pps, setPps] = useState<PPItem[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [locked, setLocked] = useState<Record<number, boolean>>({}); // lignes imposées (ACOMPTE-REGUL)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/validation/marche/${marcheId}`);
    const j = await r.json();
    const m: MarcheInfo | null = j.item || null;

    // pré-coche auto les lignes de régularisation d’acompte (ACOMPTE-REGUL)
    const auto: Record<number, boolean> = {};
    const lk: Record<number, boolean> = {};
    (m?.dpgf || []).forEach((l) => {
      const code = (l.code || "").toUpperCase();
      const isRegul =
        code === "ACOMPTE-REGUL" ||
        /REGULARISATION ACOMPTE/i.test(l.description) ||
        code === "REGUL-ACOMPTE";
      if (isRegul && l.remainingHt !== 0) {
        auto[l.id] = true; // coché
        lk[l.id] = true;   // verrouillé, on ne peut pas décocher
      }
    });

    setMarche(m);
    setChecked(auto);
    setLocked(lk);

    const r2 = await fetch(`/api/validation/marche/${marcheId}/pps`);
    const j2 = await r2.json();
    setPps(j2.items || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcheId]);

  function toggle(lineId: number) {
    if (locked[lineId]) return; // non-décochable
    setChecked((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  }

  async function validatePP() {
    const lineIds = Object.keys(checked)
      .filter((k) => checked[Number(k)])
      .map(Number);
    if (lineIds.length === 0) {
      setMsg("Sélectionnez au moins une ligne.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/validation/pp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marcheId, lineIds }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erreur");
      setMsg("PP créée !");
      setChecked({});
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  async function createAcompte() {
    const montant = prompt("Montant de l'acompte (HT) ?");
    if (!montant) return;
    const val = Number(montant.replace(",", "."));
    if (!val || isNaN(val) || val <= 0) {
      alert("Montant invalide");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/validation/marche/${marcheId}/acompte`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: val }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erreur");
      // on recharge : la ligne ACOMPTE-REGUL sera auto-cochée et verrouillée
      await load();
      setMsg("Acompte enregistré (PP d'acompte créée + régularisation auto).");
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  const lines = useMemo(() => marche?.dpgf || [], [marche]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {marche ? `Devis ${marche.reference ?? `#${marche.id}`} — ${marche.project.name}` : "…"}
        </h1>
        <div className="ml-auto">
          <Button onClick={() => router.push("/validation")} variant="outline">
            Retour
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Entreprise : <strong>{marche?.entreprise.name}</strong>
      </p>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Lignes DPGF</CardTitle>
          <CardDescription>
            Les lignes déjà validées sont grisées. Les lignes <b>ACOMPTE-REGUL</b> sont pré-cochées et ne peuvent pas être décochées.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2">Valider</th>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Description</th>
                  <th className="text-right px-3 py-2">Total HT</th>
                  <th className="text-right px-3 py-2">Déjà validé</th>
                  <th className="text-right px-3 py-2">Restant</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const done = (l.validatedHt ?? 0) >= (l.totalHt ?? 0);
                  const isLocked = !!locked[l.id];
                  return (
                    <tr
                      key={l.id}
                      className={`border-t ${done ? "text-slate-400" : ""} ${
                        isLocked ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          disabled={done || isLocked}
                          checked={!!checked[l.id]}
                          onChange={() => toggle(l.id)}
                        />
                      </td>
                      <td className="px-3 py-2">{l.code ?? ""}</td>
                      <td className="px-3 py-2">{l.description}</td>
                      <td className="px-3 py-2 text-right">{eur(l.totalHt)}</td>
                      <td className="px-3 py-2 text-right">{eur(l.validatedHt)}</td>
                      <td className="px-3 py-2 text-right">{eur(l.remainingHt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Boutons : UNIQUEMENT PP et Acompte */}
      <div className="flex items-center gap-3">
        <Button onClick={validatePP} disabled={busy}>
          {busy ? "Validation…" : "Valider la PP"}
        </Button>
        <Button onClick={createAcompte} disabled={busy} className="bg-orange-600 hover:bg-orange-700">
          Valider un acompte
        </Button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Historique des PP</CardTitle>
          <CardDescription>PP1 = première situation, puis PP2, etc.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-3 py-2">PP</th>
                  <th className="text-right px-3 py-2">Montant HT</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(pps || []).length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      Aucune PP.
                    </td>
                  </tr>
                ) : (
                  pps.map((pp) => (
                    <tr key={pp.id} className="border-t">
                      <td className="px-3 py-2">{pp.label}</td>
                      <td className="px-3 py-2 text-right">{eur(pp.totalHt)}</td>
                      <td className="px-3 py-2">
                        <a
                          className="text-blue-600 hover:underline"
                          href={`/api/validation/pp/${pp.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Télécharger le PDF
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
