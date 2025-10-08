import prisma from "@/lib/prisma";
import BatigeDashboard, {
  DashboardRoutes,
  DashboardStats,
} from "@/components/batige/BatigeDashboard";

export default async function Page() {
  // 🧭 Routes
  const routes: DashboardRoutes = {
    dashboard: "/",
    projects: "/projects",
    devis: "/devis",
    validation: "/validation",
    budget: "/budget",
    factures: "/factures",
    marchesAvenants: "/marches",
    settings: "/settings",
    allProjects: "/projects",
    allValidations: "/validation",
  };

  // 📊 Données principales
  const [projectsCount, totalProjects, recentProjects] = await Promise.all([
    prisma.project.count(),
    prisma.project.count(),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, name: true, updatedAt: true },
    }),
  ]);

  // 💰 Statistiques affichées
  const stats: DashboardStats = {
    projectsActive: projectsCount,
    projectsTotal: totalProjects,
    budgetTotalLabel: "—",
  };

  // 🚀 Rendu principal
  return (
    <BatigeDashboard
      routes={routes}
      stats={stats}
      recentProjects={recentProjects}
    />
  );
}
