export function Nav() {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <a href="/" className="font-bold">BATIGE</a>
        <a href="/projects/1" className="text-sm hover:underline">Projet #1</a>
        <a href="/budget/1" className="text-sm hover:underline">Budget</a>
        <a href="/marches/1/dpgf-edit" className="text-sm hover:underline">DPGF</a>
        <a href="/factures/nouvelle/1" className="text-sm hover:underline">Nouvelle facture</a>
        <span className="ml-auto text-xs text-slate-500">dev • local</span>
      </div>
    </div>
  );
}
