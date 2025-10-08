"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AcomptePage() {
  const { id } = useParams<{ id: string }>();
  const marcheId = Number(id);
  const router = useRouter();

  const [montant, setMontant] = useState<string>("");
  const [numero, setNumero] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    const m = Number(montant.replace(",", "."));
    if (!m || m <= 0) {
      setMsg("Saisis un montant HT valide.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/validation/marche/${marcheId}/acompte`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          montantHt: m,
          numero: numero?.trim() || undefined,
          date: date || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Erreur");
      // retour vers la page de validation
      router.push(`/validation/${marcheId}`);
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Valider un acompte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Montant HT</label>
            <Input
              placeholder="ex : 5000"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              type="number"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Numéro (optionnel)</label>
              <Input
                placeholder="ex : AC-2025xxxxx"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Date (optionnel)</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={busy}>
              {busy ? "Création..." : "Valider l’acompte"}
            </Button>
            {msg && <span className="text-sm text-red-600">{msg}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
