-- CreateTable
CREATE TABLE `imunisasi` (
    `id` VARCHAR(191) NOT NULL,
    `anak_id` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `nama_vaksin` VARCHAR(255) NOT NULL,
    `keterangan` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `imunisasi` ADD CONSTRAINT `imunisasi_anak_id_fkey` FOREIGN KEY (`anak_id`) REFERENCES `anak`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
