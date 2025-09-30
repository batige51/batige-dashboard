-- CreateTable
CREATE TABLE "Facture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "marcheId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    CONSTRAINT "Facture_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Facture_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Facture_marcheId_fkey" FOREIGN KEY ("marcheId") REFERENCES "Marche" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FactureLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factureId" INTEGER NOT NULL,
    "dpgfLineId" INTEGER NOT NULL,
    "requestedHt" REAL NOT NULL DEFAULT 0,
    "validatedHt" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "FactureLine_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FactureLine_dpgfLineId_fkey" FOREIGN KEY ("dpgfLineId") REFERENCES "DpgfLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
