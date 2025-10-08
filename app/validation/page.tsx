"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HomeButton from "@/components/ui/HomeButton";

type MarcheItem = { id: number; label: string; totalHt: number };
const eur = (n: number) =>
  (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function ValidationHome() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MarcheItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q.trim()) qs.set("q", q.trim());
    const r = await fetch(`/api/validation/marches?${qs.toString()}`);
    const json = await r.json();
    setItems(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    search();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <HomeButton />

        <h1 className="text-3xl font-extrabold tracking-tight">
          Validation des factures
        </h1>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Choisir un devis</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              className="w-[420px]"
              placeholder="Recherche (projet, entreprise, réf…)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button onClick={search} disabled={loading}>
              {loading ? "Recherche..." : "Rechercher"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2">Devis</th>
                    <th className="text-right px-3 py-2">Montant HT</th>
                    <th className="text-left px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3" colSpan={3}>
                        Aucun devis.
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id} className="border-t">
                        <td className="px-3 py-2">{it.label}</td>
                        <td className="px-3 py-2 text-right">
                          {eur(it.totalHt)}
                        </td>
                        <td className="px-3 py-2">
                          <a
                            className="text-blue-600 hover:underline"
                            href={`/validation/${it.id}`}
                          >
                            Ouvrir
                          </a>
                        </td>
                      </tr>
                    ))
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
