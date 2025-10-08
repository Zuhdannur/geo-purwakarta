-- CreateTable
CREATE TABLE "commercial_houses" (
    "id" TEXT NOT NULL,
    "id_srk" TEXT,
    "kawasan_perumahan" TEXT,
    "alamat" TEXT,
    "kecamatan" TEXT,
    "kelurahan_desa" TEXT,
    "nama_pengembang" TEXT,
    "no_izin" TEXT,
    "penutup_lahan" TEXT,
    "rawan_bencana" TEXT,
    "rencana_pola_ruang" TEXT,
    "koordinat" TEXT,
    "foto" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_houses_pkey" PRIMARY KEY ("id")
);
