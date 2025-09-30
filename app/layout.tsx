import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-20 bg-white/90 border-b backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold">BATIGE</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/projects" className="hover:underline">Projets</Link>
              <Link href="/clients/grille/1" className="hover:underline">Grille client (P1)</Link>
              <Link href="/budget/1" className="hover:underline">Budget (P1)</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
