import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BATIGE Dashboard",
  description: "Gestion des projets et marchés",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

