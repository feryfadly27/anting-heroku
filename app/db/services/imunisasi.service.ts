import { prisma } from "../prisma";

export const imunisasiService = {
  async getImunisasiByAnakId(anakId: string) {
    return await prisma.imunisasi.findMany({
      where: { anak_id: anakId },
      orderBy: { tanggal: 'desc' }
    });
  },

  async createImunisasi(imunisasi: any) {
    return await prisma.imunisasi.create({
      data: imunisasi
    });
  },

  async updateImunisasi(id: string, updates: any) {
    return await prisma.imunisasi.update({
      where: { id },
      data: updates
    });
  },

  async deleteImunisasi(id: string) {
    await prisma.imunisasi.delete({
      where: { id }
    });
    return { success: true };
  },
};
