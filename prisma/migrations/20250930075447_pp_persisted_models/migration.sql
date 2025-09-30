/*
  Warnings:

  - You are about to drop the column `totalHt` on the `PropositionPaiement` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PropositionPaiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT,
    "factureId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropositionPaiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PropositionPaiement" ("createdAt", "factureId", "id") SELECT "createdAt", "factureId", "id" FROM "PropositionPaiement";
DROP TABLE "PropositionPaiement";
ALTER TABLE "new_PropositionPaiement" RENAME TO "PropositionPaiement";
CREATE UNIQUE INDEX "PropositionPaiement_numero_key" ON "PropositionPaiement"("numero");
CREATE UNIQUE INDEX "PropositionPaiement_factureId_key" ON "PropositionPaiement"("factureId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
