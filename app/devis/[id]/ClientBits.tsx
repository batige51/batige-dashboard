"use client";

export function DeleteLineBtn({ lineId }: { lineId: number }) {
  async function run() {
    if (!confirm("Supprimer cette ligne ?")) return;
    const r = await fetch(`/api/dpgf-lines/${lineId}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Suppression impossible");
      return;
    }
    location.reload();
  }
  return (
    <button onClick={run} className="text-red-600 hover:underline" title="Supprimer la ligne">
      Suppr.
    </button>
  );
}

export function SaveRemiseForm({ marcheId, current }: { marcheId: number; current: number }) {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const value = Number(fd.get("remiseHt") || 0);
    const r = await fetch(`/api/devis/${marcheId}/remise`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ remiseHt: value }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Erreur");
      return;
    }
    location.reload();
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        name="remiseHt"
        defaultValue={current}
        type="number"
        step="0.01"
        className="w-40 rounded border px-2 py-1"
      />
      <button className="rounded bg-blue-600 text-white px-3 py-1">Enregistrer la remise</button>
      <span className="text-xs text-slate-500">
        Utilise un nombre <b>négatif</b> pour une remise (ex : -4215.20)
      </span>
    </form>
  );
}
