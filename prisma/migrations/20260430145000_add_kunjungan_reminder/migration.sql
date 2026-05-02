CREATE TABLE "kunjungan_reminder" (
    "id" TEXT NOT NULL,
    "anak_id" TEXT NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "created_by_kader_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "kunjungan_reminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "kunjungan_reminder_anak_id_key" ON "kunjungan_reminder"("anak_id");

ALTER TABLE "kunjungan_reminder" ADD CONSTRAINT "kunjungan_reminder_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "anak"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kunjungan_reminder" ADD CONSTRAINT "kunjungan_reminder_created_by_kader_id_fkey" FOREIGN KEY ("created_by_kader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
