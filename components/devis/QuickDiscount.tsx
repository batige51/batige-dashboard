"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Opt = { id: number; label: string };

export default function QuickDiscount({
  marcheId,
  dpgfOptions,
}: {
  marcheId: number;
  dpgfOptions: Opt[]; // au moins 1 ligne pour rattacher l'avenant
}) {
  const [amount, setAmount] = useState<string>("");
  const [numero, setNumero] = useState<string>("");
  const [lineId, setLineId] = useState<string>(dpgfOptions[0]?.id ? String(dpgfOptions[0].id) : "");
  const [busy, setBusy] = useState(false);
  const hasLines = dpgfOptions.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasLines) {
      alert("Il faut au moins une ligne DPGF pour rattacher la remise.");
      return;
    }
    const delta = Number(amount.replace(",", "."));
    if (Number.isNaN(delta) || delta === 0) {
      alert("Saisis un montant non nul (ex: -500)");
      return;
    }

    setBusy(true);
    try {
      const resp = await fetch(`/api/devis/${marcheId}/avenants`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          numero: numero || null,
          dpgfLineId: Number(lineId),
          deltaHt: delta, // ex: -500 pour une remise
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json.error || "Création impossible");
      setAmount("");
      setNumero("");
      // on recharge la page pour mettre les totaux à jour
      location.reload();
    } catch (e: any) {
      alert(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Remise rapide</span>
      <Input
        placeholder="N° (optionnel)"
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
        className="w-[160px]"
      />
      <select
        className="rounded border px-2 py-2"
        value={lineId}
        onChange={(e) => setLineId(e.target.value)}
        disabled={!hasLines}
      >
        {dpgfOptions.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <Input
        placeholder="Montant (ex: -500)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-[140px]"
      />
      <Button type="submit" disabled={busy || !hasLines}>
        {busy ? "…" : "Ajouter la remise"}
      </Button>
      {!hasLines && (
        <span className="text-xs text-slate-500">Ajoute d'abord au moins une ligne DPGF.</span>
      )}
    </form>
  );
}
