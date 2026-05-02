-- CreateTable
CREATE TABLE "public"."profil_anak" (
    "id" TEXT NOT NULL,
    "anak_id" TEXT NOT NULL,
    "nik_anak" VARCHAR(16),
    "tempat_lahir" VARCHAR(100),
    "panjang_lahir_cm" DOUBLE PRECISION,
    "berat_lahir_kg" DOUBLE PRECISION,
    "golongan_darah" VARCHAR(5),
    "alergi" TEXT,
    "catatan_kesehatan" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profil_anak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profil_anak_anak_id_key" ON "public"."profil_anak"("anak_id");

-- CreateIndex
CREATE UNIQUE INDEX "profil_anak_nik_anak_key" ON "public"."profil_anak"("nik_anak");

-- AddForeignKey
ALTER TABLE "public"."profil_anak" ADD CONSTRAINT "profil_anak_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."anak"("id") ON DELETE CASCADE ON UPDATE CASCADE;
