-- CreateTable
CREATE TABLE "public"."profil_ibu" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nik" VARCHAR(16) NOT NULL,
    "alamat" TEXT NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "tinggi_badan_cm" DOUBLE PRECISION NOT NULL,
    "berat_badan_kg" DOUBLE PRECISION NOT NULL,
    "golongan_darah" VARCHAR(5),
    "riwayat_penyakit" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profil_ibu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profil_ibu_user_id_key" ON "public"."profil_ibu"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profil_ibu_nik_key" ON "public"."profil_ibu"("nik");

-- AddForeignKey
ALTER TABLE "public"."profil_ibu" ADD CONSTRAINT "profil_ibu_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
