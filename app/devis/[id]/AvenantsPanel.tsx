"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AvenantsPanel({ marcheId }: { marcheId: number }) {
  const [msg, setMsg] = useState<string | null>(null);

  async function postJSON(url: string, body: any) {
    setMsg(null);
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    let j: any = {};
    try { j = await r.json(); } catch {}
    if (!r.ok) throw new Error(j?.error || "Erreur");
    return j;
  }

  async function addAvenant() {
    const description = prompt("Description de l’avenant :");
    if (!description) return;
    const montant = Number(prompt("Montant HT (ex: 1250.40) :") || "0");
    if (!isFinite(montant) || montant === 0) return alert("Montant invalide");

    try {
      await postJSON(`/api/devis/${marcheId}/avenants`, { type: "avenant", description, montantHt: montant });
      setMsg("Avenant ajouté ✅");
      location.reload();
    } catch (e: any) { setMsg(e.message); }
  }

  async function addRemise() {
    const montant = Number(prompt("Montant de la remise HT (positif) :") || "0");
    if (!isFinite(montant) || montant <= 0) return alert("Montant invalide");
    try {
      await postJSON(`/api/devis/${marcheId}/avenants`, { type: "remise", description: "Remise", montantHt: montant });
      setMsg("Remise ajoutée ✅");
      location.reload();
    } catch (e: any) { setMsg(e.message); }
  }

  async function addDeduction() {
    const toId = Number(prompt("ID du marché à DÉDUIRE (entreprise déduite) :") || "0");
    if (!isFinite(toId) || !toId) return alert("ID invalide");
    const description = prompt("Description de la déduction :");
    if (!description) return;
    const montant = Number(prompt("Montant HT (positif) :") || "0");
    if (!isFinite(montant) || montant <= 0) return alert("Montant invalide");

    try {
      await postJSON(`/api/devis/deduction`, {
        fromMarcheId: marcheId,
        toMarcheId: toId,
        description,
        montantHt: montant,
      });
      setMsg("Déduction appliquée ✅");
      location.reload();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Avenants & Ajustements</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button className="bg-blue-700" onClick={addAvenant}>Valider un avenant</Button>
        <Button className="bg-purple-700" onClick={addRemise}>Valider une remise</Button>
        <Button className="bg-red-700" onClick={addDeduction}>Valider une déduction</Button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </CardContent>
    </Card>
  );
}
