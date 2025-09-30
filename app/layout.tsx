import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "./components/Nav";

export const metadata: Metadata = { title: "BATIGE", description: "Gestion chantiers" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-4">{children}</main>
      </body>
    </html>
  );
}
