-- CreateTable
CREATE TABLE "ApplicationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "averagePoints" INTEGER NOT NULL DEFAULT 30,
    "minTransfer" INTEGER NOT NULL DEFAULT 1,
    "maxTransfer" INTEGER NOT NULL DEFAULT 30,
    "allowTransfer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
