"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Project = { id: number; name: string };
type DevisItem = {
  id: number;
  reference?: string | null;
  project: { id: number; name: string };
  entreprise: { id: number; name: string };
  lots: string[];        // lots “tels quels” en base
  montantHt: number;     // total des lignes DPGF initiales (sans avenants/remises/déductions)
  avenantsHt: number;    // somme des avenants/remises/déductions (peut être négatif)
};

const eur = (n: number) =>
  (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

// Ce sont des “lots” techniques qui ne doivent pas apparaître comme vrais lots
const EXCLUDED_LOTS = new Set(["avenants", "remise", "acompte", "annexe", "annexes"]);

export default function DevisPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [devis, setDevis] = useState<DevisItem[]>([]);
  const [search, setSearch] = useState("");

  // Filtres (en haut)
  const [projectFilter, setProjectFilter] = useState<string>("");

  // Formulaire d’import CSV (inchangé)
  const [importProjectId, setImportProjectId] = useState<string>("");
  const [entrepriseName, setEntrepriseName] = useState<string>("");
  const [lot, setLot] = useState("Gros oeuvre");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Charge les projets (pour liste & import)
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((json) => {
        const items = json.items || [];
        setProjects(items);
        if (items[0]) {
          setProjectFilter(String(items[0].id));
          setImportProjectId(String(items[0].id));
        }
      })
      .catch(() => {});
  }, []);

  // Charge la liste des devis
  const loadDevis = () => {
    const qs = new URLSearchParams();
    if (projectFilter) qs.set("projectId", projectFilter);
    if (search.trim()) qs.set("q", search.trim());
    fetch(`/api/devis?${qs.toString()}`)
      .then((r) => r.json())
      .then((json) => setDevis(json.items || []))
      .catch(() => setDevis([]));
  };

  useEffect(() => {
    loadDevis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // Ajoute un champ “lotsPropres” (lots réels sans Avenants/Remise/…)
    const items = devis.map((d) => {
      const lotsPropres = (d.lots || []).filter(
        (l) => !EXCLUDED_LOTS.has((l || "").toLowerCase())
      );
      return { ...d, lotsPropres };
    });

    if (!q) return items;

    return items.filter(
      (d) =>
        (d.reference || "").toLowerCase().includes(q) ||
        d.project.name.toLowerCase().includes(q) ||
        d.entreprise.name.toLowerCase().includes(q) ||
        (d as any).lotsPropres.some((l: string) => (l || "").toLowerCase().includes(q))
    );
  }, [search, devis]);

  async function onImport() {
    setMessage(null);
    if (!importProjectId) return setMessage("Sélectionnez un projet.");
    if (!entrepriseName.trim()) return setMessage("Saisissez le nom de l'entreprise.");
    if (!file) return setMessage("Choisissez un fichier CSV.");

    const fd = new FormData();
    fd.append("projectId", importProjectId);
    fd.append("entrepriseName", entrepriseName.trim());
    fd.append("lot", lot);
    fd.append("file", file);

    setBusy(true);
    try {
      const resp = await fetch("/api/devis/import-csv", { method: "POST", body: fd });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Échec de l'import");
      setMessage("Import réussi !");
      setFile(null);
      loadDevis();
    } catch (e: any) {
      setMessage(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Devis (DPGF)</h1>
          <div className="ml-auto">
            <Input
              placeholder="Rechercher… (projet, entreprise, lot, référence)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadDevis()}
              className="w-[380px]"
            />
          </div>
        </div>

        {/* Filtres */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <select
              className="rounded border px-2 py-1"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                loadDevis();
              }}
            >
              Réinitialiser
            </Button>
          </CardContent>
        </Card>

        {/* Import CSV */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Importer un CSV DPGF</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <select
              className="rounded border px-2 py-1"
              value={importProjectId}
              onChange={(e) => setImportProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <Input
              placeholder="Nom de l'entreprise"
              value={entrepriseName}
              onChange={(e) => setEntrepriseName(e.target.value)}
              className="w-[280px]"
            />

            <Input
              placeholder="Lot (ex : Gros oeuvre)"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              className="w-[220px]"
            />

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <Button onClick={onImport} disabled={busy}>
              {busy ? "Import..." : "Importer"}
            </Button>

            {message && <span className="text-sm text-slate-600">{message}</span>}
          </CardContent>
        </Card>

        {/* Liste */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Liste</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2">Réf</th>
                    <th className="text-left px-3 py-2">Projet</th>
                    <th className="text-left px-3 py-2">Entreprise</th>
                    <th className="text-left px-3 py-2">Lots</th>
                    <th className="text-right px-3 py-2">Montant HT</th>
                    <th className="text-right px-3 py-2">Avenants HT</th>
                    <th className="text-right px-3 py-2">Total Marché HT</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3" colSpan={8}>
                        Aucun devis.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d) => {
                      const total = (d.montantHt ?? 0) + (d.avenantsHt ?? 0);
                      return (
                        <tr key={d.id} className="border-t">
                          <td className="px-3 py-2">{d.reference ?? `#${d.id}`}</td>
                          <td className="px-3 py-2">{d.project?.name ?? "—"}</td>
                          <td className="px-3 py-2">{d.entreprise?.name ?? "—"}</td>
                          <td className="px-3 py-2">
                            {(d as any).lotsPropres?.length
                              ? (d as any).lotsPropres.join(", ")
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">{eur(d.montantHt)}</td>
                          <td className="px-3 py-2 text-right">{eur(d.avenantsHt)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{eur(total)}</td>
                          <td className="px-3 py-2">
                            <a
                              href={`/devis/${d.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Ouvrir
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
