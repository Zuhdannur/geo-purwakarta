-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Maps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "geojson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Maps" ("createdAt", "geojson", "id", "name", "updatedAt") SELECT "createdAt", "geojson", "id", "name", "updatedAt" FROM "Maps";
DROP TABLE "Maps";
ALTER TABLE "new_Maps" RENAME TO "Maps";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
