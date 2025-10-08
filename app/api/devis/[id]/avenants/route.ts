import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AvenantStatut } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/devis/:id/avenants
 * body: { type: "avenant" | "remise", description: string, montantHt: number, numero?: string }
 * - avenant : montantHt peut être +/-
 * - remise  : montantHt attendu POSITIF -> on l'applique en négatif
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const marcheId = Number(id);
  if (!marcheId) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const body = await req.json().catch(() => ({} as any));
  let { type, description, montantHt, numero } = body;
  type = String(type || "avenant");
  description = String(description || "");
  numero = String(numero || "") || `${type === "remise" ? "REM" : "AV"}-${Date.now()}`;
  let montant = Number(montantHt ?? 0);
  if (!description) return NextResponse.json({ error: "Description requise" }, { status: 400 });
  if (!isFinite(montant) || montant === 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });

  const isRemise = type === "remise";
  if (isRemise && montant > 0) montant = -montant; // remise en négatif

  // crée une vraie ligne DPGF pour qu’elle s’affiche et impacte le budget
  const line = await prisma.dpgfLine.create({
    data: {
      marcheId,
      code: isRemise ? "REMISE" : "AVENANT",
      description,
      unite: "U",
      qty: 1,
      unitPriceHt: montant,
      totalHt: montant,
      lot: isRemise ? "Remise" : "Avenants",
      idx: 999000,
    },
  });

  const avenant = await prisma.avenantEntreprise.create({
    data: {
      marcheId,
      numero,
      statut: AvenantStatut.VALIDE,
      lines: { create: [{ dpgfLineId: line.id, deltaHt: montant }] },
    },
    include: { lines: true },
  });

  return NextResponse.json({ item: { avenant, line } }, { status: 201 });
}

