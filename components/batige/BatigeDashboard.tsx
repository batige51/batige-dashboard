"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  CheckSquare,
  Upload,
  Settings,
  Building2,
  PiggyBank,
  FileText,
  Users2,
  BarChart3,
  Calculator,
  Wrench,
  Briefcase,
} from "lucide-react";

// ---- Types ----
export type DashboardStats = {
  projectsActive?: number;
  projectsTotal?: number;
  budgetTotalLabel?: string;
};

export type DashboardRoutes = {
  dashboard?: string;
  projects?: string;
  devis?: string;
  validation?: string;
  budget?: string;
  factures?: string;
  marchesAvenants?: string;
  importsExports?: string;
  settings?: string;
  allProjects?: string;
  allValidations?: string;
};

type RecentProject = {
  id: number;
  name: string;
  updatedAt: string | Date;
};

// ---- Composant principal ----
export default function BatigeDashboard({
  stats,
  routes,
  recentProjects,
}: {
  stats?: DashboardStats;
  routes?: DashboardRoutes;
  recentProjects?: RecentProject[];
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* 🧭 Sidebar */}
        <aside className="hidden md:flex w-72 flex-col border-r bg-white/90 backdrop-blur">
          <div className="px-5 py-4 flex items-center gap-3 border-b">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">BATIGE</div>
              <div className="text-xs text-muted-foreground -mt-0.5">Résidences</div>
            </div>
          </div>

          <nav className="p-3 text-sm space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Tableau de bord" href={routes?.dashboard ?? "/"} />
            <SidebarItem icon={FolderKanban} label="Projets" href={routes?.projects ?? "/projects"} />
            <SidebarItem icon={FileSpreadsheet} label="Devis" href={routes?.devis ?? "/devis"} />
            <SidebarItem icon={CheckSquare} label="Validation des factures" href={routes?.validation ?? "/validation"} />
            <SidebarItem icon={PiggyBank} label="Budget & Suivi" href={routes?.budget ?? "/budget"} />
            <SidebarItem icon={FileText} label="Marchés & Avenants" href={routes?.marchesAvenants ?? "/marches"} />

            {/* 🔒 Bouton Imports / Exports temporairement désactivé */}
            {/*
            <SidebarItem icon={Upload} label="Imports / Exports" href={routes?.importsExports ?? "/imports"} />
            */}
            
            <Separator className="my-3" />

            {/* 🆕 Sections supplémentaires */}
            <SidebarItem icon={Users2} label="Clients et grille de vente" href="#" />
            <SidebarItem icon={BarChart3} label="Analyse" href="#" />
            <SidebarItem icon={Calculator} label="Comptabilité" href="#" />
            <SidebarItem icon={Wrench} label="SAV" href="#" />
            <SidebarItem icon={Briefcase} label="Direction" href="#" />

            <Separator className="my-3" />
            <SidebarItem icon={Settings} label="Paramètres" href={routes?.settings ?? "/settings"} />
          </nav>
        </aside>

        {/* 🧩 Contenu principal */}
        <main className="flex-1">
          <TopBar />
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* 📊 Statistiques principales */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <StatCard
                title="Projets actifs"
                value={formatProjects(stats?.projectsActive, stats?.projectsTotal)}
                icon={<FolderKanban className="h-4 w-4" />}
                tone="blue"
              />
              <StatCard
                title="Budget total"
                value={stats?.budgetTotalLabel ?? "—"}
                icon={<PiggyBank className="h-4 w-4" />}
                tone="green"
              />
            </section>

            {/* 🕓 Projets récents */}
            <section className="grid grid-cols-1 gap-4 mt-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Projets récents</CardTitle>
                  <CardDescription>Derniers projets créés ou modifiés</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentProjects && recentProjects.length > 0 ? (
                    <ul className="divide-y">
                      {recentProjects.map((p) => (
                        <li key={p.id} className="py-2 flex justify-between items-center">
                          <span>{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.updatedAt).toLocaleDateString("fr-FR")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      title="Aucun projet récent"
                      description="Créez votre premier projet pour démarrer le suivi."
                      actionLabel="Voir les projets"
                      href={routes?.projects ?? "/projects"}
                    />
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// ---- Top Bar ----
function TopBar() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
        <h1 className="text-xl font-semibold">Tableau de bord BATIGE</h1>
      </div>
    </header>
  );
}

// ---- Sidebar Item ----
function SidebarItem({ icon: Icon, label, href }: { icon: any; label: string; href?: string }) {
  return (
    <a
      href={href ?? "#"}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  );
}

// ---- Stat Card ----
function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone?: "blue" | "green";
}) {
  const toneClass =
    tone === "blue"
      ? "text-blue-600"
      : tone === "green"
      ? "text-emerald-600"
      : "";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${toneClass}`}>{value ?? "—"}</div>
      </CardContent>
    </Card>
  );
}

// ---- Empty State ----
function EmptyState({
  title,
  description,
  actionLabel,
  href,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center bg-white">
      <div className="text-base font-medium">{title}</div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      {actionLabel && (
        <Button asChild className="mt-4">
          <a href={href ?? "#"}>{actionLabel}</a>
        </Button>
      )}
    </div>
  );
}

// ---- Helper ----
function formatProjects(active?: number, total?: number) {
  if (typeof active !== "number" || typeof total !== "number") return "—";
  return `${active} sur ${total}`;
}
