"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";

export default function Page({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const [lot, setLot] = useState<any>(null);
  const [client, setClient] = useState("");
  const [prix, setPrix] = useState<string>("");
  const [tva, setTva] = useState<string>("20");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    (async ()=>{
      // récup du lot via un “truc” simple : list lots projet est ailleurs
      // Ici, on va juste afficher l'id et saisir la vente
      setLot({ id: Number(lotId) });
    })();
  }, [lotId]);

  async function onCreate() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (!client.trim()) throw new Error("Client requis.");
      const res = await fetch("/api/ventes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lotId: Number(lotId),
          client: client.trim(),
          prixVenteHt: Number(prix || 0),
          tvaRate: Number(tva || 0)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
      setCreatedId(data.id);
      setMsg(`Vente créée (id: ${data.id}).`);
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nouvelle vente — Lot #{lotId}</h1>
        <Link href={`/clients/grille/1`} className="text-blue-600 hover:underline">← Retour Grille</Link>
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
      {msg && <div className="rounded bg-green-50 text-green-700 p-3">{msg}</div>}

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm w-40">Client</label>
          <input className="border rounded px-2 py-1 flex-1" value={client} onChange={(e)=>setClient(e.target.value)} placeholder="Nom Prénom" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm w-40">Prix de vente HT</label>
          <input className="border rounded px-2 py-1" type="number" step="0.01" value={prix} onChange={(e)=>setPrix(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm w-40">TVA (%)</label>
          <input className="border rounded px-2 py-1" type="number" step="0.1" value={tva} onChange={(e)=>setTva(e.target.value)} />
        </div>

        <button onClick={onCreate} disabled={busy || !client.trim()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? "Création…" : "Créer la vente"}
        </button>

        {createdId && (
          <div className="pt-2">
            <Link href={`/ventes/${createdId}`} className="text-blue-600 hover:underline">
              Ouvrir la vente #{createdId}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
