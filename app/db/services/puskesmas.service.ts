import { prisma } from "../prisma";
import { pertumbuhanService } from "./pertumbuhan.service";
import { imunisasiService } from "./imunisasi.service";
import { profilAnakService } from "./profil-anak.service";
import { intervensiGiziService } from "./intervensi-gizi.service";

// ============================================================================
// Statistics & Overview
// ============================================================================

export interface PuskesmasStats {
  totalBalita: number;
  totalKader: number;
  totalWilayah: number;
  stuntingCount: number;
  underweightCount: number;
  wastedCount: number;
  normalCount: number;
  prevalensiStunting: number; // percentage
  cakupanPemeriksaan: number; // percentage
}

export async function getPuskesmasStats(): Promise<PuskesmasStats> {
  try {
    // Total balita
    const totalBalita = await prisma.anak.count();

    // Total kader
    const totalKader = await prisma.user.count({
      where: { role: 'kader' }
    });

    // Total wilayah
    const totalWilayah = await prisma.wilayah.count();

    // Get all latest pertumbuhan data with z-scores
    const latestPertumbuhan = await prisma.pertumbuhan.findMany({
      select: {
        id: true,
        anak_id: true,
        tanggal_pengukuran: true,
        zscore_tbu: true,
        zscore_bbu: true,
        zscore_bbtb: true,
      }
    });

    // Group by anak_id and get latest for each child
    const latestByAnak = new Map<string, any>();
    latestPertumbuhan.forEach((p) => {
      const existing = latestByAnak.get(p.anak_id);
      if (!existing || new Date(p.tanggal_pengukuran) > new Date(existing.tanggal_pengukuran)) {
        latestByAnak.set(p.anak_id, p);
      }
    });

    // Count cases by category
    let stuntingCount = 0;
    let underweightCount = 0;
    let wastedCount = 0;
    let normalCount = 0;

    latestByAnak.forEach((p) => {
      const hasStunting = p.zscore_tbu !== null && p.zscore_tbu < -2;
      const hasUnderweight = p.zscore_bbu !== null && p.zscore_bbu < -2;
      const hasWasted = p.zscore_bbtb !== null && p.zscore_bbtb < -2;

      if (hasStunting) stuntingCount++;
      if (hasUnderweight) underweightCount++;
      if (hasWasted) wastedCount++;

      if (!hasStunting && !hasUnderweight && !hasWasted) {
        normalCount++;
      }
    });

    const prevalensiStunting = totalBalita > 0 ? (stuntingCount / totalBalita) * 100 : 0;
    const cakupanPemeriksaan = totalBalita > 0 ? (latestByAnak.size / totalBalita) * 100 : 0;

    return {
      totalBalita,
      totalKader,
      totalWilayah,
      stuntingCount,
      underweightCount,
      wastedCount,
      normalCount,
      prevalensiStunting,
      cakupanPemeriksaan,
    };
  } catch (error) {
    console.error("Error getting puskesmas stats:", error);
    return {
      totalBalita: 0,
      totalKader: 0,
      totalWilayah: 0,
      stuntingCount: 0,
      underweightCount: 0,
      wastedCount: 0,
      normalCount: 0,
      prevalensiStunting: 0,
      cakupanPemeriksaan: 0,
    };
  }
}

// ============================================================================
// Wilayah (Region) Management
// ============================================================================

export interface Wilayah {
  id: string;
  nama_wilayah: string;
  tipe: "desa" | "kelurahan" | "puskesmas";
}

export async function getAllWilayah(): Promise<Wilayah[]> {
  try {
    const data = await prisma.wilayah.findMany({
      orderBy: { nama_wilayah: 'asc' }
    });
    return (data as Wilayah[]) || [];
  } catch (error) {
    console.error("Error getting wilayah:", error);
    return [];
  }
}

export async function createWilayah(namaWilayah: string, tipe: "desa" | "kelurahan" | "puskesmas" = "desa"): Promise<Wilayah> {
  const cleanName = namaWilayah.trim();
  if (!cleanName) {
    throw new Error("Nama wilayah wajib diisi.");
  }
  const result = await prisma.wilayah.create({
    data: {
      nama_wilayah: cleanName,
      tipe,
    },
  });
  return result as Wilayah;
}

export async function updateWilayah(
  wilayahId: string,
  updates: { nama_wilayah?: string; tipe?: "desa" | "kelurahan" | "puskesmas" }
): Promise<Wilayah> {
  const payload: { nama_wilayah?: string; tipe?: "desa" | "kelurahan" | "puskesmas" } = {};

  if (typeof updates.nama_wilayah === "string") {
    const cleanName = updates.nama_wilayah.trim();
    if (!cleanName) {
      throw new Error("Nama wilayah wajib diisi.");
    }
    payload.nama_wilayah = cleanName;
  }

  if (updates.tipe) {
    payload.tipe = updates.tipe;
  }

  const result = await prisma.wilayah.update({
    where: { id: wilayahId },
    data: payload,
  });

  return result as Wilayah;
}

export interface WilayahStats {
  wilayah_id: string;
  nama_wilayah: string;
  tipe: "desa" | "kelurahan" | "puskesmas";
  totalBalita: number;
  stuntingCount: number;
  prevalensi: number;
}

export interface AnakPuskesmasItem {
  id: string;
  nama: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  parent_name: string | null;
  wilayah_name: string | null;
  latest_pengukuran: string | null;
  latest_berat_badan: number | null;
  latest_tinggi_badan: number | null;
  latest_zscore_tbu: number | null;
  latest_zscore_bbu: number | null;
  latest_zscore_bbtb: number | null;
  total_pertumbuhan: number;
  total_imunisasi: number;
}

export async function getAllAnakForPuskesmas(): Promise<AnakPuskesmasItem[]> {
  try {
    const data = await prisma.anak.findMany({
      orderBy: { nama: "asc" },
      include: {
        user: {
          select: {
            name: true,
            wilayah: {
              select: {
                nama_wilayah: true,
              },
            },
          },
        },
        pertumbuhan: {
          orderBy: { tanggal_pengukuran: "desc" },
          take: 1,
          select: {
            tanggal_pengukuran: true,
            berat_badan: true,
            tinggi_badan: true,
            zscore_tbu: true,
            zscore_bbu: true,
            zscore_bbtb: true,
          },
        },
        _count: {
          select: {
            pertumbuhan: true,
            imunisasi: true,
          },
        },
      },
    });

    return data.map((anak) => ({
      id: anak.id,
      nama: anak.nama,
      tanggal_lahir: anak.tanggal_lahir.toISOString(),
      jenis_kelamin: anak.jenis_kelamin,
      parent_name: anak.user?.name ?? null,
      wilayah_name: anak.user?.wilayah?.nama_wilayah ?? null,
      latest_pengukuran: anak.pertumbuhan[0]?.tanggal_pengukuran?.toISOString() ?? null,
      latest_berat_badan: anak.pertumbuhan[0]?.berat_badan ?? null,
      latest_tinggi_badan: anak.pertumbuhan[0]?.tinggi_badan ?? null,
      latest_zscore_tbu: anak.pertumbuhan[0]?.zscore_tbu ?? null,
      latest_zscore_bbu: anak.pertumbuhan[0]?.zscore_bbu ?? null,
      latest_zscore_bbtb: anak.pertumbuhan[0]?.zscore_bbtb ?? null,
      total_pertumbuhan: anak._count.pertumbuhan,
      total_imunisasi: anak._count.imunisasi,
    }));
  } catch (error) {
    console.error("Error getting all anak for puskesmas:", error);
    return [];
  }
}

export async function getAnakDetailForPuskesmas(anakId: string) {
  const cleanAnakId = anakId.trim();
  if (!cleanAnakId) return null;

  const anak = await prisma.anak.findUnique({
    where: { id: cleanAnakId },
    include: {
      user: {
        select: {
          name: true,
          wilayah: {
            select: {
              nama_wilayah: true,
            },
          },
        },
      },
    },
  });

  if (!anak) return null;

  const [pertumbuhan, imunisasi, profilAnak, intervensi] = await Promise.all([
    pertumbuhanService.getPertumbuhanByAnakId(cleanAnakId),
    imunisasiService.getImunisasiByAnakId(cleanAnakId),
    profilAnakService.getByAnakId(cleanAnakId),
    intervensiGiziService.getByAnakId(cleanAnakId),
  ]);

  return {
    anak: {
      id: anak.id,
      nama: anak.nama,
      tanggal_lahir: anak.tanggal_lahir.toISOString(),
      jenis_kelamin: anak.jenis_kelamin,
      parent_name: anak.user?.name ?? null,
      wilayah_name: anak.user?.wilayah?.nama_wilayah ?? null,
    },
    pertumbuhan,
    imunisasi,
    profilAnak,
    intervensi,
  };
}

export async function getStatsByWilayah(wilayahId?: string): Promise<WilayahStats[]> {
  try {
    const wilayahData = await prisma.wilayah.findMany({
      where: wilayahId ? { id: wilayahId } : {},
      include: {
        users: {
          where: { role: 'orang_tua' },
          include: {
            anak: {
              include: {
                pertumbuhan: {
                  orderBy: { tanggal_pengukuran: 'desc' },
                }
              }
            }
          }
        }
      }
    });

    return wilayahData.map((w) => {
      // Collect all children in this wilayah
      const children: any[] = [];
      w.users.forEach(u => {
        u.anak.forEach(a => {
          children.push(a);
        });
      });

      const totalBalita = children.length;
      let stuntingCount = 0;

      children.forEach(a => {
        const latest = a.pertumbuhan[0]; // Already ordered desc
        if (latest && latest.zscore_tbu !== null && latest.zscore_tbu < -2) {
          stuntingCount++;
        }
      });

      const prevalensi = totalBalita > 0 ? (stuntingCount / totalBalita) * 100 : 0;

      return {
        wilayah_id: w.id,
        nama_wilayah: w.nama_wilayah,
        tipe: w.tipe as "desa" | "kelurahan" | "puskesmas",
        totalBalita,
        stuntingCount,
        prevalensi,
      };
    });
  } catch (error) {
    console.error("Error getting stats by wilayah:", error);
    return [];
  }
}

// ============================================================================
// Prevalensi Trends (Monthly)
// ============================================================================

export interface MonthlyPrevalensi {
  month: string; // YYYY-MM
  totalPemeriksaan: number;
  stuntingCount: number;
  prevalensi: number;
}

export async function getMonthlyPrevalensi(months: number = 6): Promise<MonthlyPrevalensi[]> {
  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);

    const pertumbuhan = await prisma.pertumbuhan.findMany({
      where: {
        tanggal_pengukuran: {
          gte: startDate
        }
      },
      select: {
        tanggal_pengukuran: true,
        zscore_tbu: true,
        anak_id: true
      }
    });

    if (pertumbuhan.length === 0) return [];

    // Group by month
    const monthlyData = new Map<string, { count: number; stunting: number; children: Set<string> }>();

    pertumbuhan.forEach((p) => {
      const month = p.tanggal_pengukuran.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { count: 0, stunting: 0, children: new Set() });
      }

      const data = monthlyData.get(month)!;
      data.children.add(p.anak_id);
      data.count++;

      if (p.zscore_tbu !== null && p.zscore_tbu < -2) {
        data.stunting++;
      }
    });

    // Convert to array and calculate prevalensi
    const result: MonthlyPrevalensi[] = [];
    monthlyData.forEach((data, month) => {
      const prevalensi = data.count > 0 ? (data.stunting / data.count) * 100 : 0;
      result.push({
        month,
        totalPemeriksaan: data.count,
        stuntingCount: data.stunting,
        prevalensi,
      });
    });

    return result.sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error("Error getting monthly prevalensi:", error);
    return [];
  }
}

// ============================================================================
// Kader Management
// ============================================================================

export interface KaderWithStats {
  id: string;
  name: string;
  email: string;
  wilayah_id: string | null;
  wilayah_name: string | null;
  created_at: string;
  totalBalita: number;
  totalPemeriksaan: number;
}

export async function getAllKaders(): Promise<KaderWithStats[]> {
  try {
    const kaders = await prisma.user.findMany({
      where: { role: 'kader' },
      orderBy: { name: 'asc' },
      include: {
        wilayah: true
      }
    });

    const kadersWithStats = await Promise.all(
      kaders.map(async (kader) => {
        // Get parents in same wilayah
        const parents = await prisma.user.findMany({
          where: {
            role: 'orang_tua',
            wilayah_id: kader.wilayah_id
          },
          select: { id: true }
        });

        const parentIds = parents.map((p) => p.id);

        let totalBalita = 0;
        let totalPemeriksaan = 0;

        if (parentIds.length > 0) {
          totalBalita = await prisma.anak.count({
            where: { user_id: { in: parentIds } }
          });

          const children = await prisma.anak.findMany({
            where: { user_id: { in: parentIds } },
            select: { id: true }
          });
          const anakIds = children.map((c) => c.id);

          if (anakIds.length > 0) {
            totalPemeriksaan = await prisma.pertumbuhan.count({
              where: { anak_id: { in: anakIds } }
            });
          }
        }

        return {
          id: kader.id,
          name: kader.name,
          email: kader.email,
          wilayah_id: kader.wilayah_id,
          wilayah_name: kader.wilayah?.nama_wilayah || null,
          created_at: kader.created_at.toISOString(),
          totalBalita,
          totalPemeriksaan,
        };
      })
    );

    return kadersWithStats;
  } catch (error) {
    console.error("Error getting kaders:", error);
    return [];
  }
}

export async function createKader(name: string, email: string, password: string, wilayahId: string): Promise<void> {
  try {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "kader",
        wilayah_id: wilayahId,
      }
    });
  } catch (error) {
    console.error("Error creating kader:", error);
    throw error;
  }
}

export async function updateKader(
  kaderId: string,
  updates: { name?: string; email?: string; wilayah_id?: string; password?: string }
): Promise<void> {
  try {
    const payload: { name?: string; email?: string; wilayah_id?: string; password?: string } = {};

    if (typeof updates.name === "string") {
      const cleanName = updates.name.trim();
      if (!cleanName) throw new Error("Nama kader wajib diisi.");
      payload.name = cleanName;
    }

    if (typeof updates.email === "string") {
      const cleanEmail = updates.email.trim();
      if (!cleanEmail) throw new Error("Email kader wajib diisi.");
      payload.email = cleanEmail;
    }

    if (typeof updates.wilayah_id === "string") {
      if (!updates.wilayah_id.trim()) throw new Error("Wilayah kader wajib diisi.");
      payload.wilayah_id = updates.wilayah_id.trim();
    }

    if (typeof updates.password === "string" && updates.password.trim()) {
      const bcrypt = await import("bcryptjs");
      payload.password = await bcrypt.hash(updates.password.trim(), 10);
    }

    await prisma.user.update({
      where: { id: kaderId },
      data: payload
    });
  } catch (error) {
    console.error("Error updating kader:", error);
    throw error;
  }
}

export async function deleteKader(kaderId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: kaderId }
    });
  } catch (error) {
    console.error("Error deleting kader:", error);
    throw error;
  }
}

// ============================================================================
// Export Data
// ============================================================================

export interface ExportData {
  stats: PuskesmasStats;
  wilayahStats: WilayahStats[];
  monthlyPrevalensi: MonthlyPrevalensi[];
  kaders: KaderWithStats[];
  timestamp: string;
}

export async function getExportData(): Promise<ExportData> {
  const [stats, wilayahStats, monthlyPrevalensi, kaders] = await Promise.all([
    getPuskesmasStats(),
    getStatsByWilayah(),
    getMonthlyPrevalensi(12),
    getAllKaders(),
  ]);

  return {
    stats,
    wilayahStats,
    monthlyPrevalensi,
    kaders,
    timestamp: new Date().toISOString(),
  };
}
