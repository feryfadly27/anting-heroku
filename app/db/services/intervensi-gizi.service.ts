import { prisma } from "../prisma";

export const intervensiGiziService = {
  async getByAnakId(anakId: string) {
    return prisma.intervensiGizi.findMany({
      where: { anak_id: anakId },
      orderBy: { tanggal: "desc" },
    });
  },

  async createIntervensi(data: {
    anak_id: string;
    tanggal: Date;
    jenis: "PKMK" | "VITAMIN" | "ZINC";
    produk?: string;
    dosis?: string;
    catatan?: string;
  }) {
    return prisma.intervensiGizi.create({
      data: {
        ...data,
        produk: data.produk || null,
        dosis: data.dosis || null,
        catatan: data.catatan || null,
      },
    });
  },
};
