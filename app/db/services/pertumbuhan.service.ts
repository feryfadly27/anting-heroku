import { prisma } from "../prisma";
import { anakService } from "./anak.service";
import { whoReferenceService } from "./who-reference.service";
import {
  calculateZScore,
  kategorikanTBU,
  kategorikanBBU,
  kategorikanBBTB,
  hitungUmurBulan,
} from "../utils/zscore-calculator";

export const pertumbuhanService = {
  async getPertumbuhanByAnakId(anakId: string) {
    return await prisma.pertumbuhan.findMany({
      where: { anak_id: anakId },
      orderBy: { tanggal_pengukuran: 'desc' }
    });
  },

  async createPertumbuhan(pertumbuhan: any) {
    console.log("Creating pertumbuhan record:", JSON.stringify(pertumbuhan, null, 2));

    // Ambil data anak untuk mendapatkan tanggal lahir dan jenis kelamin
    const anak = await anakService.getAnakById(pertumbuhan.anak_id);
    if (!anak) {
      console.error("Anak not found for ID:", pertumbuhan.anak_id);
      throw new Error("Anak tidak ditemukan");
    }

    // Hitung umur dalam bulan
    const umurBulan = hitungUmurBulan(
      anak.tanggal_lahir,
      pertumbuhan.tanggal_pengukuran
    );
    console.log(`Calculated umurBulan: ${umurBulan} for child ${anak.nama}`);

    // Hitung Z-Score untuk TB/U
    const lmsTBU = await whoReferenceService.getReference(
      anak.jenis_kelamin,
      umurBulan,
      "TB/U"
    );
    let zscore_tbu: number | null = null;
    let kategori_tbu: string | null = null;
    if (lmsTBU) {
      zscore_tbu = calculateZScore(pertumbuhan.tinggi_badan, lmsTBU);
      kategori_tbu = kategorikanTBU(zscore_tbu);
      console.log(`TB/U result: ${zscore_tbu} (${kategori_tbu})`);
    } else {
      console.warn("LMS WHO Reference for TB/U not found");
    }

    // Hitung Z-Score untuk BB/U
    const lmsBBU = await whoReferenceService.getReference(
      anak.jenis_kelamin,
      umurBulan,
      "BB/U"
    );
    let zscore_bbu: number | null = null;
    let kategori_bbu: string | null = null;
    if (lmsBBU) {
      zscore_bbu = calculateZScore(pertumbuhan.berat_badan, lmsBBU);
      kategori_bbu = kategorikanBBU(zscore_bbu);
      console.log(`BB/U result: ${zscore_bbu} (${kategori_bbu})`);
    } else {
      console.warn("LMS WHO Reference for BB/U not found");
    }

    // Hitung Z-Score untuk BB/TB
    const lmsBBTB = await whoReferenceService.getReference(
      anak.jenis_kelamin,
      umurBulan,
      "BB/TB",
      pertumbuhan.tinggi_badan
    );
    let zscore_bbtb: number | null = null;
    let kategori_bbtb: string | null = null;
    if (lmsBBTB) {
      zscore_bbtb = calculateZScore(pertumbuhan.berat_badan, lmsBBTB);
      kategori_bbtb = kategorikanBBTB(zscore_bbtb);
      console.log(`BB/TB result: ${zscore_bbtb} (${kategori_bbtb})`);
    } else {
      console.warn("LMS WHO Reference for BB/TB not found");
    }

    console.log("Saving to database...");
    // Insert dengan Z-Score yang sudah dihitung
    const result = await prisma.pertumbuhan.create({
      data: {
        ...pertumbuhan,
        umur_bulan: umurBulan,
        zscore_tbu,
        kategori_tbu,
        zscore_bbu,
        kategori_bbu,
        zscore_bbtb,
        kategori_bbtb,
      }
    });
    console.log("Database record created successfully:", result.id);
    return result;
  },

  async updatePertumbuhan(id: string, updates: any) {
    // Ambil data pertumbuhan existing
    const existing = await prisma.pertumbuhan.findUnique({
      where: { id },
      include: {
        anak: true
      }
    });

    if (!existing) {
      throw new Error("Data pertumbuhan tidak ditemukan");
    }

    // Jika ada update berat/tinggi/tanggal, hitung ulang Z-Score
    let dataToUpdate = { ...updates };

    const shouldRecalculate =
      updates.berat_badan !== undefined ||
      updates.tinggi_badan !== undefined ||
      updates.tanggal_pengukuran !== undefined;

    if (shouldRecalculate) {
      const beratBadan = updates.berat_badan ?? existing.berat_badan;
      const tinggiBadan = updates.tinggi_badan ?? existing.tinggi_badan;
      const tanggalPengukuran = updates.tanggal_pengukuran ?? existing.tanggal_pengukuran;
      const jenisKelamin = existing.anak.jenis_kelamin;
      const tanggalLahir = existing.anak.tanggal_lahir;

      // Hitung umur dalam bulan
      const umurBulan = hitungUmurBulan(tanggalLahir, tanggalPengukuran);

      // Hitung Z-Score untuk TB/U
      const lmsTBU = await whoReferenceService.getReference(
        jenisKelamin,
        umurBulan,
        "TB/U"
      );
      if (lmsTBU) {
        const zscore_tbu = calculateZScore(tinggiBadan, lmsTBU);
        dataToUpdate.zscore_tbu = zscore_tbu;
        dataToUpdate.kategori_tbu = kategorikanTBU(zscore_tbu);
      }

      // Hitung Z-Score untuk BB/U
      const lmsBBU = await whoReferenceService.getReference(
        jenisKelamin,
        umurBulan,
        "BB/U"
      );
      if (lmsBBU) {
        const zscore_bbu = calculateZScore(beratBadan, lmsBBU);
        dataToUpdate.zscore_bbu = zscore_bbu;
        dataToUpdate.kategori_bbu = kategorikanBBU(zscore_bbu);
      }

      // Hitung Z-Score untuk BB/TB
      const lmsBBTB = await whoReferenceService.getReference(
        jenisKelamin,
        umurBulan,
        "BB/TB",
        tinggiBadan
      );
      if (lmsBBTB) {
        const zscore_bbtb = calculateZScore(beratBadan, lmsBBTB);
        dataToUpdate.zscore_bbtb = zscore_bbtb;
        dataToUpdate.kategori_bbtb = kategorikanBBTB(zscore_bbtb);
      }

      dataToUpdate.umur_bulan = umurBulan;
    }

    return await prisma.pertumbuhan.update({
      where: { id },
      data: dataToUpdate
    });
  },

  async deletePertumbuhan(id: string) {
    await prisma.pertumbuhan.delete({
      where: { id }
    });
    return { success: true };
  },
};
