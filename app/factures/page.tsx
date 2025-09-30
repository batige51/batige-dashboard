"use client";
import { useEffect, useMemo, useState } from "react";

type Opt = { id:number; name:string };

export default function Page() {
  const [projects, setProjects] = useState<Opt[]>([]);
  const [entreprises, setEntreprises] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // Filtres
  const [projectId, setProjectId] = useState<string>("");
  const [entrepriseId, setEntrepriseId] = useState<string>("");
  const [statut, setStatut] = useState<string>("");
  const [dateMin, setDateMin] = useState<string>("");
  const [dateMax, setDateMax] = useState<string>("");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async()=>{
      try {
        const [pRes, eRes] = await Promise.all([
          fetch("/api/projects", { cache: "no-store" }),
          fetch("/api/entreprises", { cache: "no-store" }),
        ]);
        const [p, e] = await Promise.all([pRes.json(), eRes.json()]);
        setProjects(p || []); setEntreprises(e || []);
      } catch(e:any) {
        setErr(e.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function search() {
    setBusy(true); setErr(null);
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (entrepriseId) params.set("entrepriseId", entrepriseId);
      if (statut) params.set("statut", statut);
      if (dateMin) params.set("dateMin", dateMin);
      if (dateMax) params.set("dateMax", dateMax);
      if (amountMin) params.set("amountMin", amountMin);
      if (amountMax) params.set("amountMax", amountMax);
      if (q) params.set("q", q);
      params.set("limit", "300");

      const res = await fetch(`/api/factures/search?${params.toString()}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `Erreur ${res.status}`);
      setItems(d.items || []);
    } catch(e:any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  useEffect(()=>{ if(!loading) search(); }, [loading]); // première recherche

  const fmt = (n:number)=> n.toLocaleString("fr-FR")+" €";

  const totalPage = useMemo(()=> items.reduce((s,i)=> s + (i.totalHT||0), 0), [items]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="text-2xl font-bold">Factures — Recherche & filtres</div>

      {/* Filtres */}
      <div className="rounded border p-4 bg-white space-y-3">
        <div className="grid md:grid-cols-4 gap-2">
          <select className="rounded border px-2 py-1" value={projectId} onChange={e=>setProjectId(e.target.value)}>
            <option value="">Projet (tous)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select className="rounded border px-2 py-1" value={entrepriseId} onChange={e=>setEntrepriseId(e.target.value)}>
            <option value="">Entreprise (toutes)</option>
            {entreprises.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select className="rounded border px-2 py-1" value={statut} onChange={e=>setStatut(e.target.value)}>
            <option value="">Statut (tous)</option>
            <option value="EN_ATTENTE">EN_ATTENTE</option>
            <option value="VALIDEE">VALIDEE</option>
            <option value="REFUSEE">REFUSEE</option>
          </select>

          <input className="rounded border px-2 py-1" placeholder="Recherche (numéro/code/description)" value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-4 gap-2">
          <input className="rounded border px-2 py-1" type="date" value={dateMin} onChange={e=>setDateMin(e.target.value)} />
          <input className="rounded border px-2 py-1" type="date" value={dateMax} onChange={e=>setDateMax(e.target.value)} />
          <input className="rounded border px-2 py-1" type="number" step="0.01" placeholder="Montant min HT" value={amountMin} onChange={e=>setAmountMin(e.target.value)} />
          <input className="rounded border px-2 py-1" type="number" step="0.01" placeholder="Montant max HT" value={amountMax} onChange={e=>setAmountMax(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button onClick={search} disabled={busy} className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Recherche…" : "Appliquer les filtres"}
          </button>
          <button onClick={()=>{
            setProjectId(""); setEntrepriseId(""); setStatut("");
            setDateMin(""); setDateMax(""); setAmountMin(""); setAmountMax(""); setQ("");
            setTimeout(search, 0);
          }} className="rounded border px-3 py-1.5 hover:bg-slate-50">
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className="rounded border overflow-hidden bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-left">Numéro</th>
              <th className="px-2 py-2 text-left">Projet</th>
              <th className="px-2 py-2 text-left">Entreprise</th>
              <th className="px-2 py-2 text-left">Marché</th>
              <th className="px-2 py-2 text-right">Total HT</th>
              <th className="px-2 py-2 text-left">Statut</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td className="px-2 py-2" colSpan={8}>Aucun résultat</td></tr>
            ) : items.map((f)=>(
              <tr key={f.id} className="border-t">
                <td className="px-2 py-1">{new Date(f.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-2 py-1">{f.numero}</td>
                <td className="px-2 py-1">{f.project}</td>
                <td className="px-2 py-1">{f.entreprise}</td>
                <td className="px-2 py-1">{f.marche}</td>
                <td className="px-2 py-1 text-right">{(f.totalHT||0).toLocaleString("fr-FR")} €</td>
                <td className="px-2 py-1">{f.statut}</td>
                <td className="px-2 py-1 text-right space-x-2">
                  <a className="rounded border px-2 py-1 hover:bg-slate-50 text-xs" href={`/validation/${f.id}`} target="_blank">Valider</a>
                  <a className="rounded border px-2 py-1 hover:bg-slate-50 text-xs" href={`/factures/${f.id}/print`} target="_blank">Imprimer</a>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t">
            <tr>
              <td className="px-2 py-2 font-medium" colSpan={5}>Total (page)</td>
              <td className="px-2 py-2 text-right font-semibold">{fmt(totalPage)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
