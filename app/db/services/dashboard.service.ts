import { prisma } from "../prisma";

export const dashboardService = {
  /**
   * Get dashboard statistics for parent
   */
  async getDashboardStats(userId: string) {
    const anakList = await prisma.anak.findMany({
      where: { user_id: userId },
      include: {
        pertumbuhan: {
          orderBy: { tanggal_pengukuran: 'desc' },
          take: 1
        }
      }
    });

    const totalAnak = anakList.length;

    if (totalAnak === 0) {
      return {
        totalAnak: 0,
        anakWithLatestData: 0,
        anakNeedAttention: 0,
        lastUpdateDate: null,
      };
    }

    let anakWithLatestData = 0;
    let anakNeedAttention = 0;
    let lastUpdateDate: Date | null = null;

    anakList.forEach((anak) => {
      const p = anak.pertumbuhan[0];
      if (p) {
        anakWithLatestData++;

        const hasCriticalZScore =
          (p.zscore_tbu !== null && p.zscore_tbu < -2) ||
          (p.zscore_bbu !== null && p.zscore_bbu < -2) ||
          (p.zscore_bbtb !== null && p.zscore_bbtb < -2);

        if (hasCriticalZScore) {
          anakNeedAttention++;
        }

        if (!lastUpdateDate || p.tanggal_pengukuran > lastUpdateDate) {
          lastUpdateDate = p.tanggal_pengukuran;
        }
      }
    });

    return {
      totalAnak,
      anakWithLatestData,
      anakNeedAttention,
      lastUpdateDate: lastUpdateDate ? lastUpdateDate.toISOString().split('T')[0] : null,
    };
  },

  /**
   * Get summary for all anak with their latest pertumbuhan data
   */
  async getAnakSummaries(userId: string) {
    const anakList = await prisma.anak.findMany({
      where: { user_id: userId },
      include: {
        pertumbuhan: {
          orderBy: { tanggal_pengukuran: 'desc' }
        },
        kunjungan_reminder: true,
      },
      orderBy: { created_at: 'desc' }
    });

    const summaries = anakList.map((anak) => {
      const latestPertumbuhan = anak.pertumbuhan[0] || null;

      const alerts: string[] = [];
      let needsAttention = false;

      if (latestPertumbuhan) {
        const p = latestPertumbuhan;
        if (p.zscore_tbu !== null && p.zscore_tbu < -2) {
          alerts.push(`TB/U: ${p.kategori_tbu || "Perlu perhatian"}`);
          needsAttention = true;
        }
        if (p.zscore_bbu !== null && p.zscore_bbu < -2) {
          alerts.push(`BB/U: ${p.kategori_bbu || "Perlu perhatian"}`);
          needsAttention = true;
        }
        if (p.zscore_bbtb !== null && p.zscore_bbtb < -2) {
          alerts.push(`BB/TB: ${p.kategori_bbtb || "Perlu perhatian"}`);
          needsAttention = true;
        }
      }

      return {
        anak,
        latestPertumbuhan,
        pertumbuhanCount: anak.pertumbuhan.length,
        reminder_kunjungan: anak.kunjungan_reminder?.tanggal_kunjungan ?? null,
        needsAttention,
        alerts,
      };
    });

    return summaries;
  },

  /**
   * Get growth trend data for a specific anak (for charts)
   */
  async getGrowthTrend(anakId: string, limit: number = 10) {
    const data = await prisma.pertumbuhan.findMany({
      where: { anak_id: anakId },
      orderBy: { tanggal_pengukuran: 'asc' },
      take: limit,
      select: {
        tanggal_pengukuran: true,
        berat_badan: true,
        tinggi_badan: true,
        zscore_tbu: true,
        zscore_bbu: true,
        zscore_bbtb: true,
      }
    });

    return data.map((p: any) => ({
      tanggal: p.tanggal_pengukuran instanceof Date ? p.tanggal_pengukuran.toISOString().split('T')[0] : p.tanggal_pengukuran,
      beratBadan: p.berat_badan,
      tinggiBadan: p.tinggi_badan,
      zscore_tbu: p.zscore_tbu,
      zscore_bbu: p.zscore_bbu,
      zscore_bbtb: p.zscore_bbtb,
    }));
  },
};
