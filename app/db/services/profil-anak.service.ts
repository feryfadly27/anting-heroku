import { prisma } from "../prisma";

type UpsertProfilAnakInput = {
  anak_id: string;
  nik_anak?: string | null;
  tempat_lahir?: string | null;
  panjang_lahir_cm?: number | null;
  berat_lahir_kg?: number | null;
  golongan_darah?: string | null;
  alergi?: string | null;
  catatan_kesehatan?: string | null;
};

export const profilAnakService = {
  async getByAnakId(anakId: string) {
    return prisma.profilAnak.findUnique({
      where: { anak_id: anakId },
    });
  },

  async upsertProfilAnak(input: UpsertProfilAnakInput) {
    return prisma.profilAnak.upsert({
      where: { anak_id: input.anak_id },
      update: {
        nik_anak: input.nik_anak ?? null,
        tempat_lahir: input.tempat_lahir ?? null,
        panjang_lahir_cm: input.panjang_lahir_cm ?? null,
        berat_lahir_kg: input.berat_lahir_kg ?? null,
        golongan_darah: input.golongan_darah ?? null,
        alergi: input.alergi ?? null,
        catatan_kesehatan: input.catatan_kesehatan ?? null,
      },
      create: {
        anak_id: input.anak_id,
        nik_anak: input.nik_anak ?? null,
        tempat_lahir: input.tempat_lahir ?? null,
        panjang_lahir_cm: input.panjang_lahir_cm ?? null,
        berat_lahir_kg: input.berat_lahir_kg ?? null,
        golongan_darah: input.golongan_darah ?? null,
        alergi: input.alergi ?? null,
        catatan_kesehatan: input.catatan_kesehatan ?? null,
      },
    });
  },
};
