CREATE TABLE "informasi" (
    "id" TEXT NOT NULL,
    "judul" VARCHAR(180) NOT NULL,
    "kategori" VARCHAR(30) NOT NULL,
    "konten" TEXT NOT NULL,
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

ALTER TABLE "informasi" ADD CONSTRAINT "informasi_wilayah_id_fkey" FOREIGN KEY ("wilayah_id") REFERENCES "wilayah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "informasi" ADD CONSTRAINT "informasi_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "informasi_wilayah_id_idx" ON "informasi"("wilayah_id");
CREATE INDEX "informasi_created_at_idx" ON "informasi"("created_at");
