import { PrismaClient } from "@prisma/client";

declare global {
  // Empêche le rechargement à chaud (Hot Reload) de recréer plusieurs instances
  var prisma: PrismaClient | undefined;
}

// 🧠 Utilisation du cache global (pour éviter les multiples connexions en dev)
const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
