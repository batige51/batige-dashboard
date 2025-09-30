"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProject() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const router = useRouter();

  async function onCreate() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      router.push("/projects");
    } catch (e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nouveau projet</h1>
      {err && <div className="rounded bg-red-50 text-red-700 p-3">{err}</div>}
      <div className="rounded border bg-white p-4 space-y-3 max-w-lg">
        <div>
          <label className="text-sm">Nom du projet</label>
          <input className="border rounded px-2 py-1 w-full" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Résidence St-Exupéry" />
        </div>
        <button onClick={onCreate} disabled={busy || !name.trim()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? "Création…" : "Créer"}
        </button>
      </div>
    </div>
  );
}
