-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_PREPARATION',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "siret" TEXT,
    "contact" TEXT
);

-- CreateTable
CREATE TABLE "Marche" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "reference" TEXT,
    "montantInitialHt" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Marche_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Marche_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DpgfLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marcheId" INTEGER NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "unite" TEXT,
    "qty" REAL NOT NULL DEFAULT 0,
    "unitPriceHt" REAL NOT NULL DEFAULT 0,
    "totalHt" REAL NOT NULL DEFAULT 0,
    "validatedHt" REAL NOT NULL DEFAULT 0,
    "lot" TEXT,
    "idx" INTEGER,
    CONSTRAINT "DpgfLine_marcheId_fkey" FOREIGN KEY ("marcheId") REFERENCES "Marche" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
