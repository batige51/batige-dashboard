"use client";

import { useEffect, useMemo, useState } from "react";
import ProjectCard, { ProjectCardData, StatusBadge } from "@/components/batige/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiProject = {
  id: number;
  name: string;
  status?: "EN_PREPARATION" | "EN_COURS" | "CLOS";
  createdAt?: string;
  updatedAt?: string;
};

export default function ProjectsPage() {
  const [items, setItems] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/projects", { cache: "no-store" });
      const j = await r.json();
      setItems(j.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: number) {
    const ok = confirm("Supprimer ce projet ? (irréversible)");
    if (!ok) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Suppression impossible");
      return;
    }
    load();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(p => p.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Titre + actions */}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Gestion des Projets</h1>
          <div className="ml-auto flex items-center gap-2">
            <Input
              placeholder="Rechercher un projet…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button asChild>
              <a href="/projects/new">+ Nouveau Projet</a>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Gérez vos projets de résidences et chantiers</p>

        {/* Contenu */}
        {err && <div className="mb-4 rounded-md bg-red-50 text-red-700 px-4 py-2 text-sm">{err}</div>}

        {loading ? (
          <Card><CardContent className="p-6">Chargement…</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Aucun projet</CardTitle>
              <CardDescription>Créez votre premier projet pour commencer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild><a href="/projects/new">Créer un projet</a></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => {
              // Ici on prépare les champs optionnels si tu les ajoutes plus tard.
              const card: ProjectCardData = {
                id: p.id,
                name: p.name,
                status: p.status ?? "EN_PREPARATION",
                // companyName: null,
                // addressLabel: null,
                // startDateLabel: null,
                // endDateLabel: null,
                // budgetLabel: null,
              };
              return <ProjectCard key={p.id} data={card} onDelete={onDelete} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
