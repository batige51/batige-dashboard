-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Facture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "marcheId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "tvaRate" REAL NOT NULL DEFAULT 20,
    "retenuePct" REAL NOT NULL DEFAULT 5,
    "isDgd" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Facture_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Facture_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Facture_marcheId_fkey" FOREIGN KEY ("marcheId") REFERENCES "Marche" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Facture" ("date", "entrepriseId", "id", "marcheId", "numero", "projectId", "statut") SELECT "date", "entrepriseId", "id", "marcheId", "numero", "projectId", "statut" FROM "Facture";
DROP TABLE "Facture";
ALTER TABLE "new_Facture" RENAME TO "Facture";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
