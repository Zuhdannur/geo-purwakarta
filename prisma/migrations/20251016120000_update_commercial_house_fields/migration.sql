-- Update commercial_houses table to new field structure

-- Rename existing columns to match new naming where possible
ALTER TABLE "commercial_houses"
  RENAME COLUMN "kawasan_perumahan" TO "nama_perumahan";

ALTER TABLE "commercial_houses"
  RENAME COLUMN "nama_pengembang" TO "nama_pengembangan";

-- Add new columns
ALTER TABLE "commercial_houses"
  ADD COLUMN "serah_terima_psu" TEXT,
  ADD COLUMN "rawan_banjir" TEXT,
  ADD COLUMN "gerakan_tanah" TEXT,
  ADD COLUMN "gempa_bumi" TEXT,
  ADD COLUMN "data_lainnya" TEXT;

-- Optional data migration: if older generic risk exists, copy to flood risk as a starting value
UPDATE "commercial_houses"
  SET "rawan_banjir" = COALESCE("rawan_banjir", "rawan_bencana")
  WHERE "rawan_bencana" IS NOT NULL;

-- Drop deprecated columns no longer used
ALTER TABLE "commercial_houses"
  DROP COLUMN IF EXISTS "penutup_lahan",
  DROP COLUMN IF EXISTS "rawan_bencana",
  DROP COLUMN IF EXISTS "rencana_pola_ruang";
