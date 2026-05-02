import { prisma } from "../prisma";
import type { LMSParameters } from "../utils/zscore-calculator";
import { interpolateLMS } from "../utils/zscore-calculator";

export interface WHOReference {
  id: string;
  jenis_kelamin: "laki_laki" | "perempuan";
  umur_bulan: number;
  indikator: "TB/U" | "BB/U" | "BB/TB";
  tinggi_cm: number | null;
  l: number;
  m: number;
  s: number;
}

function toLMS(row: any): LMSParameters {
  return {
    l: Number(row.l),
    m: Number(row.m),
    s: Number(row.s),
  };
}

function interpolateBBTB(
  tinggiCm: number,
  before: any,
  after: any
): LMSParameters {
  const t1 = Number(before.tinggi_cm);
  const t2 = Number(after.tinggi_cm);
  const ratio = (tinggiCm - t1) / (t2 - t1);

  return {
    l: Number(before.l) + ratio * (Number(after.l) - Number(before.l)),
    m: Number(before.m) + ratio * (Number(after.m) - Number(before.m)),
    s: Number(before.s) + ratio * (Number(after.s) - Number(before.s)),
  };
}

export const whoReferenceService = {
  async getReferenceByAge(
    jenisKelamin: any,
    umurBulan: number,
    indikator: "TB/U" | "BB/U"
  ): Promise<LMSParameters | null> {
    const targetAgeDays = Math.round(umurBulan * 30.4375);
    const exactData = await prisma.whoReference.findFirst({
      where: {
        jenis_kelamin: jenisKelamin,
        indikator: indikator,
        umur_bulan: targetAgeDays
      }
    });

    if (exactData) {
      return toLMS(exactData);
    }

    const allData = await prisma.whoReference.findMany({
      where: {
        jenis_kelamin: jenisKelamin,
        indikator: indikator
      },
      orderBy: { umur_bulan: 'asc' }
    });

    if (allData.length === 0) return null;
    const minAgeDays = allData[0].umur_bulan;
    const maxAgeDays = allData[allData.length - 1].umur_bulan;
    if (targetAgeDays < minAgeDays || targetAgeDays > maxAgeDays) {
      console.warn(
        `WHO ${indikator} out of range: umur ${umurBulan} bln (~${targetAgeDays} hari), supported ${minAgeDays}-${maxAgeDays} hari`
      );
      return null;
    }

    const before = allData
      .filter((d) => d.umur_bulan <= targetAgeDays)
      .sort((a, b) => b.umur_bulan - a.umur_bulan)[0];

    const after = allData
      .filter((d) => d.umur_bulan > targetAgeDays)
      .sort((a, b) => a.umur_bulan - b.umur_bulan)[0];

    if (!before && after) return toLMS(after);
    if (before && !after) return toLMS(before);
    if (!before && !after) return null;

    return interpolateLMS(
      targetAgeDays,
      { umur_bulan: before.umur_bulan, ...toLMS(before) },
      { umur_bulan: after.umur_bulan, ...toLMS(after) }
    );
  },

  async getReferenceByHeight(
    jenisKelamin: any,
    tinggiBadan: number,
    umurBulan: number
  ): Promise<LMSParameters | null> {
    const roundedHeight = Math.round(tinggiBadan);
    const ageTag = umurBulan <= 24 ? 24 : 25;

    const exactData = await prisma.whoReference.findFirst({
      where: {
        jenis_kelamin: jenisKelamin,
        indikator: "BB/TB",
        umur_bulan: ageTag,
        tinggi_cm: roundedHeight
      }
    });

    if (exactData) {
      return toLMS(exactData);
    }

    const allData = await prisma.whoReference.findMany({
      where: {
        jenis_kelamin: jenisKelamin,
        indikator: "BB/TB",
        umur_bulan: ageTag,
      },
      orderBy: { tinggi_cm: 'asc' }
    });

    if (allData.length === 0) return null;
    const tinggiData = allData.filter((d) => d.tinggi_cm !== null);
    if (tinggiData.length === 0) return null;
    const minHeight = Number(tinggiData[0].tinggi_cm);
    const maxHeight = Number(tinggiData[tinggiData.length - 1].tinggi_cm);
    if (tinggiBadan < minHeight || tinggiBadan > maxHeight) {
      console.warn(`WHO BB/TB out of range: tinggi ${tinggiBadan} (supported ${minHeight}-${maxHeight})`);
      return null;
    }

    const before = allData
      .filter((d) => d.tinggi_cm !== null && d.tinggi_cm <= tinggiBadan)
      .sort((a, b) => (b.tinggi_cm || 0) - (a.tinggi_cm || 0))[0];

    const after = allData
      .filter((d) => d.tinggi_cm !== null && d.tinggi_cm > tinggiBadan)
      .sort((a, b) => (a.tinggi_cm || 0) - (b.tinggi_cm || 0))[0];

    if (!before && after) return toLMS(after);
    if (before && !after) return toLMS(before);
    if (!before && !after) return null;

    return interpolateBBTB(tinggiBadan, before, after);
  },

  async getReference(
    jenisKelamin: any,
    umurBulan: number,
    indikator: "TB/U" | "BB/U" | "BB/TB",
    tinggiBadan?: number
  ): Promise<LMSParameters | null> {
    if (indikator === "BB/TB" && tinggiBadan) {
      return this.getReferenceByHeight(jenisKelamin, tinggiBadan, umurBulan);
    }
    if (indikator === "TB/U" || indikator === "BB/U") {
      return this.getReferenceByAge(jenisKelamin, umurBulan, indikator);
    }
    return null;
  },

  async bulkInsertReference(references: any[]) {
    return await prisma.whoReference.createMany({
      data: references
    });
  },

  async clearAllReference() {
    await prisma.whoReference.deleteMany({});
    return { success: true };
  },
};
