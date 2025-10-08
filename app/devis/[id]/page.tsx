// app/devis/[id]/page.tsx
import AvenantsPanel from "./AvenantsPanel";
import { PrismaClient } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DeleteLineButton, DeleteDevisButton } from "@/components/devis/ClientButtons";
import { Button } from "@/components/ui/button"; // ✅ AJOUT ICI
import HomeButton from "@/components/ui/HomeButton";


export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

function eur(n: number) {
  return (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

async function getMarche(id: number) {
  return prisma.marche.findUnique({
    where: { id },
    include: {
      project: true,
      entreprise: true,
      dpgf: true,
      AvenantEntreprise: { include: { lines: true } },
    },
  });
}

// ⚠️ Ici on respecte la convention de ton projet : params est un Promise
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const marcheId = Number(id);
  const marche = await getMarche(marcheId);

  if (!marche) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">Devis introuvable.</CardContent>
        </Card>
      </div>
    );
  }

  const totalHt = (marche.dpgf ?? []).reduce((s, l) => s + (l.totalHt ?? 0), 0);
  const avenantsHt = (marche.AvenantEntreprise ?? [])
    .flatMap((a) => a.lines)
    .reduce((s, l) => s + (l.deltaHt ?? 0), 0);

  const lots = Array.from(
    new Set((marche.dpgf ?? []).map((l) => l.lot).filter(Boolean))
  ) as string[];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Titre + actions */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Devis {marche.reference ?? `#${marche.id}`} — {marche.project.name}
          </h1>
          <div className="ml-auto flex gap-2">
            <Button asChild>
              <a href="/devis">Retour</a>
            </Button>
            <DeleteDevisButton marcheId={marcheId} />
          </div>
        </div>

        {/* Bandeau info */}
        <p className="text-sm text-muted-foreground">
          Entreprise : <strong>{marche.entreprise.name}</strong> — Montant HT :{" "}
          <strong>{eur(totalHt)}</strong> — Avenants :{" "}
          <strong>{eur(avenantsHt)}</strong> — Total marché HT :{" "}
          <strong>{eur(totalHt + avenantsHt)}</strong>
        </p>

        {/* Lignes DPGF */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Lignes DPGF</CardTitle>
            <CardDescription>Tu peux supprimer une ligne si elle est en trop.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2">Code</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-left px-3 py-2">Unité</th>
                    <th className="text-right px-3 py-2">Qté</th>
                    <th className="text-right px-3 py-2">PU HT</th>
                    <th className="text-right px-3 py-2">Total HT</th>
                    <th className="text-left px-3 py-2">Lot</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(marche.dpgf ?? []).length === 0 ? (
                    <tr>
                      <td className="px-3 py-3" colSpan={8}>
                        Aucune ligne.
                      </td>
                    </tr>
                  ) : (
                    (marche.dpgf ?? []).map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="px-3 py-2">{l.code ?? ""}</td>
                        <td className="px-3 py-2">{l.description}</td>
                        <td className="px-3 py-2">{l.unite ?? ""}</td>
                        <td className="px-3 py-2 text-right">
                          {l.qty?.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-2 text-right">{eur(l.unitPriceHt ?? 0)}</td>
                        <td className="px-3 py-2 text-right">{eur(l.totalHt ?? 0)}</td>
                        <td className="px-3 py-2">{l.lot ?? ""}</td>
                        <td className="px-3 py-2">
                          <DeleteLineButton marcheId={marcheId} lineId={l.id} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Lots détectés */}
        {lots.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Lots détectés</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {lots.map((lot) => (
                <span
                  key={lot}
                  className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs"
                >
                  {lot}
                </span>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Avenants & Remise */}
        {/* On ne passe PAS de prop "dpgf" à AvenantsPanel, son type ne l'attend pas */}
        <AvenantsPanel marcheId={marcheId} />
      </div>
    </div>
  );
}
