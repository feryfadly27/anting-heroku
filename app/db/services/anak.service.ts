import { prisma } from "../prisma";

export const anakService = {
  async getAnakByUserId(userId: string) {
    return await prisma.anak.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
  },

  async getAnakById(id: string) {
    return await prisma.anak.findUnique({
      where: { id }
    });
  },

  async createAnak(anak: any) {
    return await prisma.anak.create({
      data: anak
    });
  },

  async updateAnak(id: string, updates: any) {
    return await prisma.anak.update({
      where: { id },
      data: updates
    });
  },

  async deleteAnak(id: string) {
    await prisma.anak.delete({
      where: { id }
    });
    return { success: true };
  },
};
