"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HomeButton from "@/components/ui/HomeButton";

type Facture = {
  id: number;
  numero: string;
  project?: { name: string };
  entreprise?: { name: string };
  totalHt?: number;
};

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/factures")
      .then((r) => r.json())
      .then((j) => setFactures(j.items ?? []))
      .catch(() => setFactures([]));
  }, []);

  const filtered = factures.filter((f) =>
    [f.numero, f.project?.name, f.entreprise?.name]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <HomeButton />
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold">Factures</h1>
          <div className="ml-auto flex gap-2">
            <Input
              placeholder="Rechercher une facture…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Liste des factures</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p>Aucune facture trouvée.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Numéro</th>
                    <th className="px-3 py-2 text-left">Projet</th>
                    <th className="px-3 py-2 text-left">Entreprise</th>
                    <th className="px-3 py-2 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="px-3 py-2">{f.numero}</td>
                      <td className="px-3 py-2">{f.project?.name ?? "—"}</td>
                      <td className="px-3 py-2">{f.entreprise?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {f.totalHt?.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
  
