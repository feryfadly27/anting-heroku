import { prisma } from "../prisma";

export const cadreService = {
  /**
   * Get all children in cadre's area (wilayah)
   */
  async getAnakByWilayah(wilayahId: string) {
    const data = await prisma.user.findMany({
      where: {
        wilayah_id: wilayahId,
        role: 'orang_tua'
      },
      include: {
        anak: {
          include: {
            pertumbuhan: {
              orderBy: { tanggal_pengukuran: 'desc' },
              take: 1
            },
            imunisasi: {
              orderBy: { tanggal: 'desc' }
            },
            kunjungan_reminder: true,
          }
        }
      }
    });

    const result: any[] = [];
    data.forEach(parent => {
      parent.anak.forEach(a => {
        result.push({
          ...a,
          parent_name: parent.name,
          parent_email: parent.email,
          latest_pertumbuhan: a.pertumbuhan[0] || null,
          imunisasi_list: a.imunisasi || [],
          imunisasi_count: a.imunisasi.length,
          reminder_kunjungan: a.kunjungan_reminder?.tanggal_kunjungan ?? null,
        });
      });
    });

    return result;
  },

  /**
   * Get statistics for cadre dashboard
   */
  async getCadreStats(wilayahId: string) {
    const anakList = await this.getAnakByWilayah(wilayahId);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const pemeriksaanBulanIni = await prisma.pertumbuhan.count({
      where: {
        anak: {
          user: { wilayah_id: wilayahId }
        },
        tanggal_pengukuran: { gte: firstDayOfMonth }
      }
    });

    let anakPerluPerhatian = 0;
    let normalCount = 0;

    anakList.forEach((anak) => {
      const p = anak.latest_pertumbuhan;
      if (!p) return;

      const hasCriticalZScore =
        (p.zscore_tbu !== null && p.zscore_tbu < -2) ||
        (p.zscore_bbu !== null && p.zscore_bbu < -2) ||
        (p.zscore_bbtb !== null && p.zscore_bbtb < -2);

      if (hasCriticalZScore) {
        anakPerluPerhatian++;
      } else {
        normalCount++;
      }
    });

    const persentaseNormal =
      anakList.length > 0 ? Math.round((normalCount / anakList.length) * 100) : 0;

    return {
      total_anak: anakList.length,
      total_pemeriksaan_bulan_ini: pemeriksaanBulanIni,
      anak_perlu_perhatian: anakPerluPerhatian,
      persentase_normal: persentaseNormal,
    };
  },

  /**
   * Get monthly recap for a specific month and year
   */
  async getMonthlyRecap(wilayahId: string, month: number, year: number) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59);

    const anakList = await this.getAnakByWilayah(wilayahId);

    const pertumbuhanData = await prisma.pertumbuhan.findMany({
      where: {
        anak: {
          user: { wilayah_id: wilayahId }
        },
        tanggal_pengukuran: {
          gte: firstDay,
          lte: lastDay
        }
      },
      orderBy: { tanggal_pengukuran: 'desc' }
    });

    // Group by anak_id to get latest in that month
    const latestByAnak = new Map<string, any>();
    pertumbuhanData.forEach(p => {
      if (!latestByAnak.has(p.anak_id)) {
        latestByAnak.set(p.anak_id, p);
      }
    });

    let normalCount = 0;
    let stuntedCount = 0;
    let severelyStuntedCount = 0;
    let underweightCount = 0;
    let wastedCount = 0;

    latestByAnak.forEach((p) => {
      if (p.kategori_tbu === "Severely Stunted") severelyStuntedCount++;
      else if (p.kategori_tbu === "Stunted") stuntedCount++;
      else if (p.kategori_tbu === "Normal") normalCount++;

      if (p.kategori_bbu === "Severely Underweight" || p.kategori_bbu === "Underweight")
        underweightCount++;

      if (p.kategori_bbtb === "Severely Wasted" || p.kategori_bbtb === "Wasted")
        wastedCount++;
    });

    return {
      month: firstDay.toLocaleString("id-ID", { month: "long" }),
      year,
      total_anak: anakList.length,
      total_pemeriksaan: pertumbuhanData.length,
      normal_count: normalCount,
      stunted_count: stuntedCount,
      severely_stunted_count: severelyStuntedCount,
      underweight_count: underweightCount,
      wasted_count: wastedCount,
    };
  },

  /**
   * Get monthly recaps for the last 6 months
   */
  async getRecentMonthlyRecaps(wilayahId: string) {
    const now = new Date();
    const recaps: any[] = [];

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const recap = await this.getMonthlyRecap(wilayahId, month, year);
      recaps.push(recap);
    }

    return recaps;
  },
};
