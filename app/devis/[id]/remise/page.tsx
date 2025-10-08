"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RemisePage() {
  const { id } = useParams<{id:string}>();
  const marcheId = Number(id);
  const router = useRouter();
  const [montant, setMontant] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setMsg(null);
    const amount = Number(montant);
    if (isNaN(amount) || amount <= 0) { setMsg("Saisis un montant positif (ex: 500)"); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/devis/${marcheId}/remise`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Erreur");
      router.push(`/devis/${marcheId}`);
    } catch (e:any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Valider une remise</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Montant de la remise (ex: 500)" value={montant} onChange={(e)=>setMontant(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</Button>
            <Button variant="outline" onClick={()=>router.push(`/devis/${marcheId}`)}>Annuler</Button>
          </div>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
