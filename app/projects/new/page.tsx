"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) return setError(j?.error ?? "Création impossible");
    router.push("/projects");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Nouveau projet</CardTitle>
            <CardDescription>Créez un projet pour commencer le suivi.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
            )}

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="project-name">
                  Nom du projet
                </label>
                <Input
                  id="project-name"
                  autoFocus
                  required
                  placeholder="Ex : SCCV SAINT LOUIS AÉROPORT"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Exemple : “Résidence Les Oliviers”, “Villa Méditerranée”, etc.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button variant="outline" type="button" onClick={() => router.push("/projects")}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
