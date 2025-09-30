-- CreateTable
CREATE TABLE "AvenantEntreprise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marcheId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    CONSTRAINT "AvenantEntreprise_marcheId_fkey" FOREIGN KEY ("marcheId") REFERENCES "Marche" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvenantLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "avenantId" INTEGER NOT NULL,
    "dpgfLineId" INTEGER NOT NULL,
    "deltaHt" REAL NOT NULL,
    CONSTRAINT "AvenantLine_avenantId_fkey" FOREIGN KEY ("avenantId") REFERENCES "AvenantEntreprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AvenantLine_dpgfLineId_fkey" FOREIGN KEY ("dpgfLineId") REFERENCES "DpgfLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
