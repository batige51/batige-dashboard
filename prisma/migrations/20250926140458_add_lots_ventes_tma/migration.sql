-- CreateTable
CREATE TABLE "Lot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "typologie" TEXT,
    "surface" REAL,
    "prixCatalogueHt" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Lot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VenteActee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lotId" INTEGER NOT NULL,
    "client" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prixVenteHt" REAL NOT NULL DEFAULT 0,
    "tvaRate" REAL NOT NULL DEFAULT 0,
    "tmaTotalHt" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "VenteActee_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TmaLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "venteId" INTEGER NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "deltaHt" REAL NOT NULL,
    CONSTRAINT "TmaLine_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "VenteActee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
