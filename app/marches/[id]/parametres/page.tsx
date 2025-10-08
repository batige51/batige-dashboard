"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const marcheId = Number(id);
  const router = useRouter();

  const [rg, setRg] = useState<string>("");
  const [prorata, setProrata] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/marches/${marcheId}/rgprorata`);
      const j = await r.json();
      if (j?.item) {
        setRg(String(j.item.rgPct ?? 0));
        setProrata(String(j.item.prorataPct ?? 0));
      }
    })();
  }, [marcheId]);

  async function save() {
    setMsg(null);
    const r = await fetch(`/api/marches/${marcheId}/rgprorata`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rgPct: Number(rg) || 0, prorataPct: Number(prorata) || 0 }),
    });
    const j = await r.json();
    if (!r.ok) { setMsg(j?.error || "Erreur"); return; }
    setMsg("Enregistré.");
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Paramètres du devis #{marcheId}</h1>

      <Card>
        <CardHeader><CardTitle>RG & Prorata</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-40">RG (%)</label>
            <Input value={rg} onChange={(e)=>setRg(e.target.value)} placeholder="ex : 5" />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-40">Prorata (%)</label>
            <Input value={prorata} onChange={(e)=>setProrata(e.target.value)} placeholder="ex : 2" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={save}>Enregistrer</Button>
            {msg && <span className="text-sm text-slate-600">{msg}</span>}
            <Button variant="secondary" onClick={()=>router.push(`/validation/${marcheId}`)}>Retour</Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Ces pourcentages s’appliquent automatiquement au calcul du Net à payer sur chaque certificat (PP) de ce devis.
      </p>
    </div>
  );
}
