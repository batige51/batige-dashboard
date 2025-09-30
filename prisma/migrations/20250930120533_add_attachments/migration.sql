-- CreateTable
CREATE TABLE "Attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "factureId" INTEGER,
    "marcheId" INTEGER,
    CONSTRAINT "Attachment_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attachment_marcheId_fkey" FOREIGN KEY ("marcheId") REFERENCES "Marche" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PropositionPaiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factureId" INTEGER NOT NULL,
    "numero" TEXT,
    "totalHt" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropositionPaiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PropositionPaiement" ("createdAt", "factureId", "id", "numero") SELECT "createdAt", "factureId", "id", "numero" FROM "PropositionPaiement";
DROP TABLE "PropositionPaiement";
ALTER TABLE "new_PropositionPaiement" RENAME TO "PropositionPaiement";
CREATE UNIQUE INDEX "PropositionPaiement_factureId_key" ON "PropositionPaiement"("factureId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
