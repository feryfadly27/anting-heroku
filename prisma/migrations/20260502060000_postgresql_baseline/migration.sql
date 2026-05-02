-- CreateEnum
CREATE TYPE "Role" AS ENUM ('orang_tua', 'kader', 'puskesmas');

-- CreateEnum
CREATE TYPE "TipeWilayah" AS ENUM ('desa', 'kelurahan', 'puskesmas');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('laki_laki', 'perempuan');

-- CreateEnum
CREATE TYPE "JenisIntervensiGizi" AS ENUM ('PKMK', 'VITAMIN', 'ZINC');

-- CreateTable
CREATE TABLE "wilayah" (
    "id" TEXT NOT NULL,
    "nama_wilayah" VARCHAR(255) NOT NULL,
    "tipe" "TipeWilayah" NOT NULL,

    CONSTRAINT "wilayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "wilayah_id" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informasi" (
    "id" TEXT NOT NULL,
    "judul" VARCHAR(180) NOT NULL,
    "kategori" VARCHAR(30) NOT NULL,
    "konten" TEXT NOT NULL,
    "gambar_data_url" TEXT,
    "tanggal_kegiatan" DATE,
    "lokasi" VARCHAR(180),
    "wilayah_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_by_role" "Role" NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "informasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profil_ibu" (
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
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "profil_ibu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anak" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kunjungan_reminder" (
    "id" TEXT NOT NULL,
    "anak_id" TEXT NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "created_by_kader_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "kunjungan_reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervensi_gizi" (
    "id" TEXT NOT NULL,
    "anak_id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jenis" "JenisIntervensiGizi" NOT NULL,
    "produk" VARCHAR(100),
    "dosis" VARCHAR(50),
    "catatan" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervensi_gizi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profil_anak" (
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
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "profil_anak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imunisasi" (
    "id" TEXT NOT NULL,
    "anak_id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "nama_vaksin" VARCHAR(255) NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imunisasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pertumbuhan" (
    "id" TEXT NOT NULL,
    "anak_id" TEXT NOT NULL,
    "tanggal_pengukuran" DATE NOT NULL,
    "berat_badan" DOUBLE PRECISION NOT NULL,
    "tinggi_badan" DOUBLE PRECISION NOT NULL,
    "lila_cm" DOUBLE PRECISION,
    "lingkar_kepala" DOUBLE PRECISION,
    "umur_bulan" INTEGER,
    "zscore_tbu" DOUBLE PRECISION,
    "kategori_tbu" VARCHAR(50),
    "zscore_bbu" DOUBLE PRECISION,
    "kategori_bbu" VARCHAR(50),
    "zscore_bbtb" DOUBLE PRECISION,
    "kategori_bbtb" VARCHAR(50),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pertumbuhan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "who_reference" (
    "id" TEXT NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "umur_bulan" INTEGER NOT NULL,
    "indikator" VARCHAR(20) NOT NULL,
    "tinggi_cm" DOUBLE PRECISION,
    "l" DOUBLE PRECISION NOT NULL,
    "m" DOUBLE PRECISION NOT NULL,
    "s" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "who_reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profil_ibu_user_id_key" ON "profil_ibu"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profil_ibu_nik_key" ON "profil_ibu"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "kunjungan_reminder_anak_id_key" ON "kunjungan_reminder"("anak_id");

-- CreateIndex
CREATE UNIQUE INDEX "profil_anak_anak_id_key" ON "profil_anak"("anak_id");

-- CreateIndex
CREATE UNIQUE INDEX "profil_anak_nik_anak_key" ON "profil_anak"("nik_anak");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_wilayah_id_fkey" FOREIGN KEY ("wilayah_id") REFERENCES "wilayah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informasi" ADD CONSTRAINT "informasi_wilayah_id_fkey" FOREIGN KEY ("wilayah_id") REFERENCES "wilayah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informasi" ADD CONSTRAINT "informasi_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_ibu" ADD CONSTRAINT "profil_ibu_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anak" ADD CONSTRAINT "anak_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kunjungan_reminder" ADD CONSTRAINT "kunjungan_reminder_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "anak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kunjungan_reminder" ADD CONSTRAINT "kunjungan_reminder_created_by_kader_id_fkey" FOREIGN KEY ("created_by_kader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervensi_gizi" ADD CONSTRAINT "intervensi_gizi_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "anak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_anak" ADD CONSTRAINT "profil_anak_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "anak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imunisasi" ADD CONSTRAINT "imunisasi_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "anak"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pertumbuhan" ADD CONSTRAINT "pertumbuhan_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "anak"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
