"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MarcheLite = { id:number; reference?:string|null; entreprise:{id:number; name:string} };

export default function DeductionPage() {
  const { id } = useParams<{id:string}>();
  const toMarcheId = Number(id); // celui qui FAIT le travail (+Δ)
  const router = useRouter();

  const [list, setList] = useState<MarcheLite[]>([]);
  const [fromId, setFromId] = useState<string>("");
  const [numero, setNumero] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [msg, setMsg] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      // récupère tous les devis du même projet pour proposer les entreprises à déduire
      const r1 = await fetch(`/api/devis/${toMarcheId}`, { cache: "no-store" });
      const m = await r1.json();
      const projectId = m?.item?.projectId;
      if (!projectId) return;

      const r2 = await fetch(`/api/devis?projectId=${projectId}`);
      const j2 = await r2.json();
      const items = (j2.items || []) as any[];
      const others: MarcheLite[] = items
        .filter((x) => x.id !== toMarcheId)
        .map((x) => ({ id: x.id, reference: x.reference, entreprise: x.entreprise }));
      setList(others);
      if (others[0]) setFromId(String(others[0].id));
    })();
  }, [toMarcheId]);

  async function save() {
    setMsg(null);
    const amount = Number(montant);
    const fromMarcheId = Number(fromId);
    if (!fromMarcheId) { setMsg("Sélectionne l'entreprise à déduire"); return; }
    if (isNaN(amount) || amount <= 0) { setMsg("Montant positif requis"); return; }
    if (!description.trim()) { setMsg("Ajoute une description"); return; }

    setBusy(true);
    try {
      const r = await fetch("/api/devis/deduction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fromMarcheId,
          toMarcheId,
          numero: numero || null,
          description: description.trim(),
          amount,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Erreur");
      router.push(`/devis/${toMarcheId}`);
    } catch (e:any) {
      setMsg(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Valider une déduction</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="text-sm">Entreprise à déduire</label>
          <select className="rounded border px-2 py-1 w-full" value={fromId} onChange={(e)=>setFromId(e.target.value)}>
            {list.map((m) => (
              <option key={m.id} value={m.id}>
                {m.entreprise?.name ?? "—"} — {m.reference ?? `#${m.id}`}
              </option>
            ))}
          </select>

          <Input placeholder="N° (optionnel)" value={numero} onChange={(e)=>setNumero(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
          <Input placeholder="Montant HT (ex: 750)" value={montant} onChange={(e)=>setMontant(e.target.value)} />

          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</Button>
            <Button variant="outline" onClick={()=>router.push(`/devis/${toMarcheId}`)}>Annuler</Button>
          </div>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
