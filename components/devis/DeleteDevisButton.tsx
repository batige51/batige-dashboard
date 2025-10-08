"use client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteDevisButton({ id, redirectTo }: { id: number; redirectTo?: string }) {
  async function handleDelete() {
    const ok = confirm("Supprimer ce devis ? (action irréversible)");
    if (!ok) return;

    const res = await fetch(`/api/devis/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      alert(j?.error ?? "Suppression impossible");
      return;
    }
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      window.location.reload();
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} title="Supprimer le devis">
      <Trash2 className="h-4 w-4 mr-1" />
      Supprimer
    </Button>
  );
}
