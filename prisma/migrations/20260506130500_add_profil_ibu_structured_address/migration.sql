ALTER TABLE "profil_ibu"
ADD COLUMN "rt" VARCHAR(10),
ADD COLUMN "rw" VARCHAR(10),
ADD COLUMN "kelurahan" VARCHAR(120),
ADD COLUMN "kecamatan" VARCHAR(120),
ADD COLUMN "kabupaten_kota" VARCHAR(120);

ALTER TABLE "profil_ibu"
ALTER COLUMN "golongan_darah" TYPE VARCHAR(20);

ALTER TABLE "profil_anak"
ALTER COLUMN "golongan_darah" TYPE VARCHAR(20);
