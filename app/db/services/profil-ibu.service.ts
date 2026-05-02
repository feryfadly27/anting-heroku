import { prisma } from "../prisma";

type UpsertProfilIbuInput = {
  user_id: string;
  nik: string;
  alamat: string;
  tanggal_lahir: Date;
  tinggi_badan_cm: number;
  berat_badan_kg: number;
  golongan_darah?: string | null;
  riwayat_penyakit?: string | null;
};

export const profilIbuService = {
  async getByUserId(userId: string) {
    return prisma.profilIbu.findUnique({
      where: { user_id: userId },
    });
  },

  async hasProfile(userId: string) {
    const existing = await prisma.profilIbu.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    return !!existing;
  },

  async upsertProfilIbu(input: UpsertProfilIbuInput) {
    return prisma.profilIbu.upsert({
      where: { user_id: input.user_id },
      update: {
        nik: input.nik,
        alamat: input.alamat,
        tanggal_lahir: input.tanggal_lahir,
        tinggi_badan_cm: input.tinggi_badan_cm,
        berat_badan_kg: input.berat_badan_kg,
        golongan_darah: input.golongan_darah ?? null,
        riwayat_penyakit: input.riwayat_penyakit ?? null,
      },
      create: {
        ...input,
      },
    });
  },
};
