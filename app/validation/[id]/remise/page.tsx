"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RemisePage() {
  const { id } = useParams<{ id: string }>();
  const marcheId = Number(id);
  const router = useRouter();

  const [numero, setNumero] = useState("");
  const [description, setDescription] = useState("Remise commerciale");
  const [montant, setMontant] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/marches/${marcheId}/avenant-libre`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          numero: numero.trim() || undefined,
          description: description.trim(),
          montantHt: -Math.abs(Number(montant)), // NEGATIF
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Échec création remise");
      setMsg("Remise enregistrée ✅");
      setTimeout(() => router.push(`/validation/${marcheId}`), 800);
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Valider une remise</h1>
        <div className="ml-auto"><Button variant="outline" onClick={() => router.push(`/validation/${marcheId}`)}>Retour</Button></div>
      </div>

      <Card>
        <CardHeader><CardTitle>Remise (avenant libre négatif)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-sm mb-1">N° (optionnel)</label>
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="ex: REM-001" />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Montant HT (positif à saisir)</label>
            <Input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="ex: 500" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={busy || !description.trim() || Number(montant) <= 0}>
              {busy ? "Enregistrement…" : "Valider la remise"}
            </Button>
            {msg && <span className="text-sm text-slate-600">{msg}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

