-- CreateTable
CREATE TABLE `wilayah` (
    `id` VARCHAR(191) NOT NULL,
    `nama_wilayah` VARCHAR(255) NOT NULL,
    `tipe` ENUM('desa', 'kelurahan', 'puskesmas') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('orang_tua', 'kader', 'puskesmas') NOT NULL,
    `wilayah_id` VARCHAR(191) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anak` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `tanggal_lahir` DATE NOT NULL,
    `jenis_kelamin` ENUM('laki_laki', 'perempuan') NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pertumbuhan` (
    `id` VARCHAR(191) NOT NULL,
    `anak_id` VARCHAR(191) NOT NULL,
    `tanggal_pengukuran` DATE NOT NULL,
    `berat_badan` DOUBLE NOT NULL,
    `tinggi_badan` DOUBLE NOT NULL,
    `lingkar_kepala` DOUBLE NULL,
    `zscore_tbu` DOUBLE NULL,
    `zscore_bbu` DOUBLE NULL,
    `zscore_bbtb` DOUBLE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_wilayah_id_fkey` FOREIGN KEY (`wilayah_id`) REFERENCES `wilayah`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anak` ADD CONSTRAINT `anak_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pertumbuhan` ADD CONSTRAINT `pertumbuhan_anak_id_fkey` FOREIGN KEY (`anak_id`) REFERENCES `anak`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
