import { prisma } from "../prisma";

export const kunjunganReminderService = {
  async upsertReminder(data: { anak_id: string; tanggal_kunjungan: Date; created_by_kader_id: string }) {
    return prisma.kunjunganReminder.upsert({
      where: { anak_id: data.anak_id },
      update: {
        tanggal_kunjungan: data.tanggal_kunjungan,
        created_by_kader_id: data.created_by_kader_id,
      },
      create: {
        anak_id: data.anak_id,
        tanggal_kunjungan: data.tanggal_kunjungan,
        created_by_kader_id: data.created_by_kader_id,
      },
    });
  },

  async deleteByAnakId(anakId: string) {
    return prisma.kunjunganReminder.deleteMany({
      where: { anak_id: anakId },
    });
  },
};
