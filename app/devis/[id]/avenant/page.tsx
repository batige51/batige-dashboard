"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AvenantLibrePage() {
  const { id } = useParams<{id:string}>();
  const marcheId = Number(id);
  const router = useRouter();

  const [numero, setNumero] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setMsg(null);
    const delta = Number(montant);
    if (isNaN(delta)) { setMsg("Montant invalide"); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/devis/${marcheId}/avenants`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "libre", numero: numero || null, description, deltaHt: delta }),
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
        <CardHeader><CardTitle>Valider un avenant</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="N° avenant (optionnel)" value={numero} onChange={(e)=>setNumero(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
          <Input placeholder="Montant HT (ex: 1250.50 ou -800)" value={montant} onChange={(e)=>setMontant(e.target.value)} />
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
