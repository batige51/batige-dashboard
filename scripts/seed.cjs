const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Projet
  const p = await prisma.project.create({
    data: { name: "Résidence Les Oliviers", status: "EN_COURS" },
  });

  // Entreprise
  const e = await prisma.entreprise.create({
    data: { name: "ONORATO" },
  });

  // Marché
  const m = await prisma.marche.create({
    data: {
      projectId: p.id,
      entrepriseId: e.id,
      reference: "MAR-001",
      montantInitialHt: 500000,
    },
  });

  // DPGF (2 lignes d'exemple)
  await prisma.dpgfLine.createMany({
    data: [
      { marcheId: m.id, code: "CAR-001", description: "Carrelage RDC", unite: "m2", qty: 120, unitPriceHt: 35, totalHt: 120 * 35 },
      { marcheId: m.id, code: "CAR-002", description: "Carrelage étages", unite: "m2", qty: 300, unitPriceHt: 33, totalHt: 300 * 33 },
    ],
  });
}

main()
  .then(() => {
    console.log("✅ Seed OK");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Seed erreur:", e);
    process.exit(1);
  });
