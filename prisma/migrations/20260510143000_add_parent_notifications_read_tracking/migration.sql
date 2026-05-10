-- CreateEnum
CREATE TYPE "NotificationSourceType" AS ENUM ('informasi', 'kunjungan_reminder');

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_type" "NotificationSourceType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_user_id_source_type_source_id_key"
ON "notification_reads"("user_id", "source_type", "source_id");

-- CreateIndex
CREATE INDEX "notification_reads_user_id_idx"
ON "notification_reads"("user_id");

-- AddForeignKey
ALTER TABLE "notification_reads"
ADD CONSTRAINT "notification_reads_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
