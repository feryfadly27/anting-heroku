-- CreateEnum
CREATE TYPE "public"."JenisIntervensiGizi" AS ENUM ('PKMK', 'VITAMIN', 'ZINC');

-- CreateTable
CREATE TABLE "public"."intervensi_gizi" (
    "id" TEXT NOT NULL,
    "anak_id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jenis" "public"."JenisIntervensiGizi" NOT NULL,
    "produk" VARCHAR(100),
    "dosis" VARCHAR(50),
    "catatan" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervensi_gizi_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."intervensi_gizi" ADD CONSTRAINT "intervensi_gizi_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."anak"("id") ON DELETE CASCADE ON UPDATE CASCADE;
