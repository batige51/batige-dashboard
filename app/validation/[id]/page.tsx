"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HomeButton from "@/components/ui/HomeButton";

type Line = {
  id: number;
  code?: string | null;
  description: string;
  totalHt: number;
  validatedHt: number;
  remainingHt: number;
  progressPct?: number;
  progressHt?: number;
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
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/validation/marche/${marcheId}`);
    const j = await r.json();
    const m: MarcheInfo | null = j.item || null;

    const auto: Record<number, boolean> = {};
    const lk: Record<number, boolean> = {};
    (m?.dpgf || []).forEach((l) => {
      const code = (l.code || "").toUpperCase();
      const isRegul =
        code === "ACOMPTE-REGUL" ||
        /REGULARISATION ACOMPTE/i.test(l.description) ||
        code === "REGUL-ACOMPTE";
      if (isRegul && l.remainingHt !== 0) {
        auto[l.id] = true;
        lk[l.id] = true;
      }
      l.progressPct = 100;
      l.progressHt = l.totalHt;
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
  }, [marcheId]);

  function handleProgressChange(lineId: number, field: "pct" | "ht", value: number) {
    setMarche((prev) => {
      if (!prev) return prev;
      const dpgf = prev.dpgf.map((l) => {
        if (l.id !== lineId) return l;
        const updated = { ...l };
        if (field === "pct") {
          updated.progressPct = value;
          updated.progressHt = (l.totalHt * value) / 100;
        } else {
          updated.progressHt = value;
          updated.progressPct = (value / l.totalHt) * 100;
        }
        return updated;
      });
      return { ...prev, dpgf };
    });
  }

  // ✅ NOUVELLE LOGIQUE ici
  function toggle(lineId: number) {
    if (locked[lineId]) return;
    setChecked((prev) => ({ ...prev, [lineId]: !prev[lineId] }));

    setMarche((prev) => {
      if (!prev) return prev;

      const lines = [...prev.dpgf];
      const index = lines.findIndex((l) => l.id === lineId);
      if (index === -1) return prev;

      const line = { ...lines[index] };
      const progress = Math.min(line.progressHt ?? 0, line.totalHt);
      const remaining = line.totalHt - progress;

      // si pas partiel → rien à changer
      if (remaining <= 0.01) return prev;

      // marquer la ligne comme validée partiellement
      line.validatedHt = progress;
      line.description = `${line.description} (validé ${line.progressPct?.toFixed(0)}%)`;

      // nouvelle ligne pour le restant
      const newLine: Line = {
        ...line,
        id: Math.floor(Math.random() * 1000000000),
        description: `${line.description.replace(/\(validé.*\)/, "").trim()} (reste)`,
        validatedHt: 0,
        totalHt: remaining,
        progressPct: 100,
        progressHt: remaining,
      };

      // insérer juste en dessous
      lines.splice(index + 1, 0, newLine);

      // figer la ligne validée
      lines[index] = line;

      return { ...prev, dpgf: lines };
    });
  }

async function validatePP() {
  if (!marche) return;
  const selectedLines = marche.dpgf.filter((l) => checked[l.id]);

  if (selectedLines.length === 0) {
    setMsg("Sélectionnez au moins une ligne.");
    return;
  }

  // Préparation des montants exacts à valider
  const payload = selectedLines.map((l) => ({
    id: l.id,
    validatedHt: Number(l.progressHt ?? l.totalHt),
  }));

  setBusy(true);
  setMsg(null);
  try {
    const r = await fetch("/api/validation/pp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ marcheId, lines: payload }), // 🔁 on envoie les montants
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
            <p>
              Les lignes déjà validées sont grisées. Les lignes <b>ACOMPTE-REGUL</b> sont
              pré-cochées et ne peuvent pas être décochées.
            </p>
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
                  <th className="text-right px-3 py-2">Avancement</th>
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
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={l.progressPct ?? 100}
                            onChange={(e) =>
                              handleProgressChange(l.id, "pct", Number(e.target.value))
                            }
                            className="w-16 text-right border rounded px-1"
                          />
                          <span>%</span>
                          <input
                            type="number"
                            min="0"
                            value={l.progressHt ?? l.totalHt}
                            onChange={(e) =>
                              handleProgressChange(l.id, "ht", Number(e.target.value))
                            }
                            className="w-24 text-right border rounded px-1"
                          />
                          <span>€</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={validatePP} disabled={busy}>
          {busy ? "Validation…" : "Valider la PP"}
        </Button>
        <Button
          onClick={createAcompte}
          disabled={busy}
          className="bg-orange-600 hover:bg-orange-700"
        >
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
