"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Bouton pour supprimer UNE ligne DPGF */
export function DeleteLineButton({ marcheId, lineId }: { marcheId: number; lineId: number }) {
  const [busy, setBusy] = useState(false);
  async function onDel() {
    if (!confirm("Supprimer cette ligne DPGF ?")) return;
    setBusy(true);
    try {
      const resp = await fetch(`/api/devis/${marcheId}/dpgf-lines/${lineId}`, { method: "DELETE" });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || "Suppression impossible");
      }
      location.reload();
    } catch (e: any) {
      alert(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="destructive" size="sm" onClick={onDel} disabled={busy}>
      {busy ? "…" : "Supprimer"}
    </Button>
  );
}

/** Bouton pour supprimer TOUT le devis */
export function DeleteDevisButton({ marcheId }: { marcheId: number }) {
  const [busy, setBusy] = useState(false);
  async function onDel() {
    if (!confirm("Supprimer tout le devis ? (irréversible)")) return;
    setBusy(true);
    try {
      const resp = await fetch(`/api/devis/${marcheId}`, { method: "DELETE" });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || "Suppression impossible");
      }
      location.href = "/devis";
    } catch (e: any) {
      alert(e?.message || "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="destructive" onClick={onDel} disabled={busy}>
      {busy ? "…" : "Supprimer le devis"}
    </Button>
  );
}
