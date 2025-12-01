-- AlterTable
ALTER TABLE "Maps" ADD COLUMN     "geojsonPath" TEXT;

-- Make geojson nullable for backward compatibility
ALTER TABLE "Maps" ALTER COLUMN "geojson" DROP NOT NULL;

