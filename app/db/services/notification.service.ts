import { prisma } from "../prisma";

type SourceType = "informasi" | "kunjungan_reminder";

export type ParentNotificationItem = {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data: Record<string, unknown>;
};

function buildInformasiWhere(wilayahId?: string | null) {
  return {
    AND: [{ is_published: true }, wilayahId ? { OR: [{ wilayah_id: wilayahId }, { wilayah_id: null }] } : {}],
  };
}

export const notificationService = {
  async getParentNotifications(params: {
    userId: string;
    wilayahId?: string | null;
    limit?: number;
  }): Promise<{ items: ParentNotificationItem[]; unreadCount: number }> {
    const limit = params.limit ?? 30;

    const [informasiRows, reminderRows] = await Promise.all([
      prisma.informasi.findMany({
        where: buildInformasiWhere(params.wilayahId),
        orderBy: { created_at: "desc" },
        take: 300,
        select: {
          id: true,
          judul: true,
          konten: true,
          kategori: true,
          lokasi: true,
          tanggal_kegiatan: true,
          created_at: true,
          created_by_role: true,
          created_by_user: { select: { name: true } },
        },
      }),
      prisma.kunjunganReminder.findMany({
        where: { anak: { user_id: params.userId } },
        orderBy: [{ updated_at: "desc" }, { created_at: "desc" }],
        take: 300,
        select: {
          id: true,
          tanggal_kunjungan: true,
          created_at: true,
          updated_at: true,
          anak: {
            select: {
              id: true,
              nama: true,
            },
          },
        },
      }),
    ]);

    const sourcePairs: Array<{ source_type: "informasi" | "kunjungan_reminder"; source_id: string }> = [
      ...informasiRows.map((x) => ({ source_type: "informasi" as const, source_id: x.id })),
      ...reminderRows.map((x) => ({ source_type: "kunjungan_reminder" as const, source_id: x.id })),
    ];

    const readRows =
      sourcePairs.length > 0
        ? await (prisma as any).notificationRead.findMany({
            where: {
              user_id: params.userId,
              OR: sourcePairs.map((x) => ({
                source_type: x.source_type,
                source_id: x.source_id,
              })),
            },
            select: { source_type: true, source_id: true },
          })
        : [];

    const readSet = new Set(
      (readRows as Array<{ source_type: string; source_id: string }>).map((r) => `${r.source_type}:${r.source_id}`),
    );

    const informasiItems: ParentNotificationItem[] = informasiRows.map((row) => {
      const key = `informasi:${row.id}`;
      return {
        id: key,
        sourceType: "informasi",
        sourceId: row.id,
        title: row.judul,
        message: row.konten,
        createdAt: row.created_at.toISOString(),
        read: readSet.has(key),
        data: {
          kategori: row.kategori,
          lokasi: row.lokasi,
          tanggalKegiatan: row.tanggal_kegiatan ? row.tanggal_kegiatan.toISOString() : null,
          createdByRole: row.created_by_role,
          creatorName: row.created_by_user?.name ?? null,
        },
      };
    });

    const reminderItems: ParentNotificationItem[] = reminderRows.map((row) => {
      const key = `kunjungan_reminder:${row.id}`;
      const createdAt = row.updated_at ?? row.created_at;
      return {
        id: key,
        sourceType: "kunjungan_reminder",
        sourceId: row.id,
        title: `Reminder Kunjungan ${row.anak.nama}`,
        message: `Jadwal kunjungan untuk ${row.anak.nama} pada ${new Date(row.tanggal_kunjungan).toLocaleDateString("id-ID")}.`,
        createdAt: createdAt.toISOString(),
        read: readSet.has(key),
        data: {
          anakId: row.anak.id,
          anakNama: row.anak.nama,
          tanggalKunjungan: row.tanggal_kunjungan.toISOString(),
        },
      };
    });

    const allItems = [...informasiItems, ...reminderItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const unreadCount = allItems.filter((x) => !x.read).length;
    const items = allItems.slice(0, limit);

    return { items, unreadCount };
  },

  async markNotificationsRead(params: {
    userId: string;
    items: Array<{ sourceType: "informasi" | "kunjungan_reminder"; sourceId: string }>;
  }): Promise<{ success: true }> {
    for (const item of params.items) {
      await (prisma as any).notificationRead.upsert({
        where: {
          user_id_source_type_source_id: {
            user_id: params.userId,
            source_type: item.sourceType,
            source_id: item.sourceId,
          },
        },
        update: {
          read_at: new Date(),
        },
        create: {
          user_id: params.userId,
          source_type: item.sourceType,
          source_id: item.sourceId,
        },
      });
    }

    return { success: true };
  },

  async markAllNotificationsRead(params: { userId: string; wilayahId?: string | null }): Promise<{ success: true }> {
    const [informasiRows, reminderRows] = await Promise.all([
      prisma.informasi.findMany({
        where: buildInformasiWhere(params.wilayahId),
        select: { id: true },
      }),
      prisma.kunjunganReminder.findMany({
        where: { anak: { user_id: params.userId } },
        select: { id: true },
      }),
    ]);

    const items: Array<{ sourceType: "informasi" | "kunjungan_reminder"; sourceId: string }> = [
      ...informasiRows.map((x) => ({ sourceType: "informasi" as const, sourceId: x.id })),
      ...reminderRows.map((x) => ({ sourceType: "kunjungan_reminder" as const, sourceId: x.id })),
    ];

    return this.markNotificationsRead({ userId: params.userId, items });
  },
};
