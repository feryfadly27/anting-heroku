import { prisma } from "../prisma";

const ALLOWED_CATEGORIES = ["kegiatan", "penyuluhan", "gizi", "pengumuman"] as const;
type InformasiCategory = (typeof ALLOWED_CATEGORIES)[number];

export function isValidInformasiCategory(value: string): value is InformasiCategory {
  return ALLOWED_CATEGORIES.includes(value as InformasiCategory);
}

export const informasiService = {
  async listForRole(params: { wilayahId?: string; includeUnpublished?: boolean; limit?: number }) {
    const limit = params.limit ?? 100;
    return prisma.informasi.findMany({
      where: {
        AND: [
          params.includeUnpublished ? {} : { is_published: true },
          params.wilayahId ? { OR: [{ wilayah_id: params.wilayahId }, { wilayah_id: null }] } : {},
        ],
      },
      orderBy: [{ is_pinned: "desc" }, { created_at: "desc" }],
      take: limit,
      select: {
        id: true,
        judul: true,
        kategori: true,
        konten: true,
        gambar_data_url: true,
        tanggal_kegiatan: true,
        lokasi: true,
        wilayah_id: true,
        created_by_role: true,
        created_by_user_id: true,
        is_published: true,
        is_pinned: true,
        created_at: true,
        created_by_user: {
          select: {
            name: true,
          },
        },
      },
    });
  },

  async create(data: {
    judul: string;
    kategori: InformasiCategory;
    konten: string;
    gambar_data_url?: string | null;
    tanggal_kegiatan?: Date | null;
    lokasi?: string | null;
    wilayah_id?: string | null;
    created_by_user_id: string;
    created_by_role: "kader" | "puskesmas";
    is_published?: boolean;
    is_pinned?: boolean;
  }) {
    return prisma.informasi.create({
      data: {
        ...data,
        lokasi: data.lokasi || null,
        wilayah_id: data.wilayah_id || null,
        tanggal_kegiatan: data.tanggal_kegiatan || null,
        gambar_data_url: data.gambar_data_url || null,
        is_published: data.is_published ?? true,
        is_pinned: data.is_pinned ?? false,
      },
    });
  },

  async getById(id: string) {
    return prisma.informasi.findUnique({
      where: { id },
      select: {
        id: true,
        created_by_user_id: true,
        created_by_role: true,
        wilayah_id: true,
      },
    });
  },

  async updateById(
    id: string,
    data: {
      judul: string;
      kategori: InformasiCategory;
      konten: string;
      gambar_data_url?: string | null;
      tanggal_kegiatan?: Date | null;
      lokasi?: string | null;
      is_pinned?: boolean;
    }
  ) {
    return prisma.informasi.update({
      where: { id },
      data: {
        judul: data.judul,
        kategori: data.kategori,
        konten: data.konten,
        gambar_data_url: data.gambar_data_url || null,
        tanggal_kegiatan: data.tanggal_kegiatan || null,
        lokasi: data.lokasi || null,
        ...(data.is_pinned !== undefined ? { is_pinned: data.is_pinned } : {}),
      },
    });
  },

  async deleteById(id: string) {
    return prisma.informasi.delete({
      where: { id },
    });
  },
};
