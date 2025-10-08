import BatigeDashboard, { DashboardRoutes, DashboardStats } from "@/components/batige/BatigeDashboard";

export default async function Page() {
  const routes: DashboardRoutes = {
    dashboard: "/",
    projects: "/projects",
    devis: "/devis",           // <- Devis
    factures: "/factures",     // <- Factures
    validation: "/validation",
    pp: "/pp",
    budget: "/budget",
    marchesAvenants: "/marches",
    importsExports: "/imports",
    settings: "/settings",
    newInvoice: "/factures/nouvelle",
    importDpgf: "/devis",
    allProjects: "/projects",
    allValidations: "/validation",
  };

  const stats: DashboardStats = {}; // on ne met pas de données de test

  return <BatigeDashboard routes={routes} stats={stats} />;
}

