-- CreateTable
CREATE TABLE "PropositionPaiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factureId" INTEGER NOT NULL,
    "totalHt" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropositionPaiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PpLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ppId" INTEGER NOT NULL,
    "dpgfLineId" INTEGER NOT NULL,
    "previousHt" REAL NOT NULL DEFAULT 0,
    "currentHt" REAL NOT NULL DEFAULT 0,
    "remainingHt" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PpLine_ppId_fkey" FOREIGN KEY ("ppId") REFERENCES "PropositionPaiement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PpLine_dpgfLineId_fkey" FOREIGN KEY ("dpgfLineId") REFERENCES "DpgfLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PropositionPaiement_factureId_key" ON "PropositionPaiement"("factureId");
