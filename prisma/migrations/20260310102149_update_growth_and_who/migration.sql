-- AlterTable
ALTER TABLE `pertumbuhan` ADD COLUMN `kategori_bbtb` VARCHAR(50) NULL,
    ADD COLUMN `kategori_bbu` VARCHAR(50) NULL,
    ADD COLUMN `kategori_tbu` VARCHAR(50) NULL,
    ADD COLUMN `umur_bulan` INTEGER NULL;

-- CreateTable
CREATE TABLE `who_reference` (
    `id` VARCHAR(191) NOT NULL,
    `jenis_kelamin` ENUM('laki_laki', 'perempuan') NOT NULL,
    `umur_bulan` INTEGER NOT NULL,
    `indikator` VARCHAR(20) NOT NULL,
    `tinggi_cm` DOUBLE NULL,
    `l` DOUBLE NOT NULL,
    `m` DOUBLE NOT NULL,
    `s` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
