import prisma from "@/lib/prisma";

export async function deleteProject(projectId: number) {
  // Récupère les lots du projet et leurs ventes associées
  const lots = await prisma.lot.findMany({
    where: { projectId },
    include: { ventes: true },
  });

  const venteIds = lots.flatMap((l) => l.ventes.map((v) => v.id));
const venteIds = lots.flatMap((l: any) => l.ventes.map((v: any) => v.id));
  // Supprime les TMA liées aux ventes
  await prisma.tmaLine.deleteMany({
    where: { venteId: { in: venteIds } },
  });

  // Supprime les ventes
  await prisma.venteActee.deleteMany({
    where: { id: { in: venteIds } },
  });

  // Supprime les lots
  await prisma.lot.deleteMany({
    where: { projectId },
  });

  // Supprime le projet
  await prisma.project.delete({
    where: { id: projectId },
  });
}
