"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMarcheForP1() {
  const [entrepriseName, setEntrepriseName] = useState("ONORATO");
  const [reference, setReference] = useState("MAR-001");
  const [montant, setMontant] = useState("0");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const router = useRouter();

  async function onCreate() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/marches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: 1,
          entrepriseName,
          reference,
          montantInitialHt: Number(montant || 0),
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setMsg(`Marché créé #${d.id} — ${d.reference}`);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nouveau marché (Projet 1)</h1>
      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
      {msg && <div className="rounded bg-green-50 text-green-700 p-3">{msg}</div>}
      <div className="rounded border bg-white p-4 space-y-3 max-w-lg">
        <div>
          <label className="text-sm">Entreprise</label>
          <input className="border rounded px-2 py-1 w-full" value={entrepriseName} onChange={(e)=>setEntrepriseName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Référence marché</label>
          <input className="border rounded px-2 py-1 w-full" value={reference} onChange={(e)=>setReference(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Montant initial HT</label>
          <input className="border rounded px-2 py-1 w-full" type="number" step="0.01" value={montant} onChange={(e)=>setMontant(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={onCreate} disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Création…" : "Créer"}
          </button>
          <button onClick={()=>router.push("/projects")} className="rounded border px-4 py-2">Retour projets</button>
        </div>
      </div>
    </div>
  );
}
