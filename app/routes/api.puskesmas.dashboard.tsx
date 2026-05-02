import {
    getPuskesmasStats,
    getAllWilayah,
    getStatsByWilayah,
    getMonthlyPrevalensi,
    getAllKaders,
    getAllAnakForPuskesmas,
    getAnakDetailForPuskesmas,
    createKader,
    createWilayah,
    updateKader,
    updateWilayah,
    deleteKader,
    getExportData,
} from "~/db/services/puskesmas.service";
import { getAuthUser } from "~/utils/auth.server";
import { informasiService, isValidInformasiCategory } from "~/db/services/informasi.service";

export async function loader({ request }: { request: Request }) {
    const user = await getAuthUser(request);
    if (!user || user.role !== "puskesmas") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
        const escapeCsv = (value: unknown) => {
            const str = String(value ?? "");
            return `"${str.replace(/"/g, '""')}"`;
        };

        if (action === "stats") {
            return Response.json(await getPuskesmasStats());
        }
        if (action === "wilayah") {
            return Response.json(await getAllWilayah());
        }
        if (action === "wilayah-stats") {
            const filter = url.searchParams.get("filter") || undefined;
            return Response.json(await getStatsByWilayah(filter));
        }
        if (action === "monthly") {
            const months = parseInt(url.searchParams.get("months") || "6");
            return Response.json(await getMonthlyPrevalensi(months));
        }
        if (action === "kaders") {
            return Response.json(await getAllKaders());
        }
        if (action === "anak") {
            return Response.json(await getAllAnakForPuskesmas());
        }
        if (action === "anak-detail") {
            const anakId = String(url.searchParams.get("anakId") || "").trim();
            if (!anakId) {
                return Response.json({ error: "anakId is required" }, { status: 400 });
            }
            const detail = await getAnakDetailForPuskesmas(anakId);
            if (!detail) {
                return Response.json({ error: "Data anak tidak ditemukan." }, { status: 404 });
            }
            return Response.json(detail);
        }
        if (action === "export") {
            return Response.json(await getExportData());
        }
        if (action === "export-csv") {
            const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
            const exportData = await getExportData();
            const rows: string[] = [];

            rows.push("Ringkasan Puskesmas");
            rows.push("periode,total_balita,total_kader,prevalensi_stunting,cakupan_pemeriksaan");
            rows.push(
                [
                    escapeCsv(month),
                    exportData.stats.totalBalita,
                    exportData.stats.totalKader,
                    exportData.stats.prevalensiStunting.toFixed(1),
                    exportData.stats.cakupanPemeriksaan.toFixed(1),
                ].join(",")
            );

            rows.push("");
            rows.push("Wilayah Prioritas");
            rows.push("nama_wilayah,total_balita,stunting,prevalensi");
            exportData.wilayahStats.forEach((w) => {
                rows.push(
                    [
                        escapeCsv(w.nama_wilayah),
                        w.totalBalita,
                        w.stuntingCount,
                        w.prevalensi.toFixed(1),
                    ].join(",")
                );
            });

            rows.push("");
            rows.push("Tren Bulanan");
            rows.push("bulan,total_pemeriksaan,stunting,prevalensi");
            exportData.monthlyPrevalensi.forEach((m) => {
                rows.push(
                    [
                        escapeCsv(m.month),
                        m.totalPemeriksaan,
                        m.stuntingCount,
                        m.prevalensi.toFixed(1),
                    ].join(",")
                );
            });

            const filename = `rekap-puskesmas-${month}.csv`;
            return new Response(rows.join("\n"), {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                    "Cache-Control": "no-store",
                },
            });
        }
        if (action === "informasi") {
            return Response.json(
                await informasiService.listForRole({
                    wilayahId: user.wilayah_id,
                    includeUnpublished: true,
                    limit: 300,
                })
            );
        }

        // Default: return all data
        const [stats, wilayahList, wilayahStats, monthlyData, kaders] = await Promise.all([
            getPuskesmasStats(),
            getAllWilayah(),
            getStatsByWilayah(),
            getMonthlyPrevalensi(6),
            getAllKaders(),
        ]);
        return Response.json({ stats, wilayahList, wilayahStats, monthlyData, kaders });
    } catch (error) {
        console.error("Puskesmas dashboard API error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function action({ request }: { request: Request }) {
    const user = await getAuthUser(request);
    if (!user || user.role !== "puskesmas") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent") as string;

    try {
        const ensureCanManageInformasi = async (informasiId: string) => {
            const info = await informasiService.getById(informasiId);
            if (!info) return false;
            return (
                info.created_by_user_id === user.id &&
                info.created_by_role === "puskesmas" &&
                (info.wilayah_id || null) === (user.wilayah_id || null)
            );
        };

        if (intent === "create-kader") {
            const data = JSON.parse(formData.get("data") as string);
            const result = await createKader(
                String(data.name || "").trim(),
                String(data.email || "").trim(),
                String(data.password || ""),
                String(data.wilayahId || data.wilayah_id || "")
            );
            return Response.json(result);
        }
        if (intent === "create-wilayah") {
            const data = JSON.parse(formData.get("data") as string);
            const namaWilayah = String(data.nama_wilayah || "").trim();
            const tipe = String(data.tipe || "desa") as "desa" | "kelurahan" | "puskesmas";
            if (!namaWilayah) {
                return Response.json({ error: "Nama wilayah wajib diisi." }, { status: 400 });
            }
            const result = await createWilayah(namaWilayah, tipe);
            return Response.json(result);
        }
        if (intent === "update-kader") {
            const id = String(formData.get("id") || "").trim();
            const data = JSON.parse(String(formData.get("data") || "{}"));
            if (!id) {
                return Response.json({ error: "ID kader wajib diisi." }, { status: 400 });
            }
            const name = String(data.name || "").trim();
            const email = String(data.email || "").trim();
            const wilayahId = String(data.wilayahId || data.wilayah_id || "").trim();
            const password = String(data.password || "");
            if (!name || !email || !wilayahId) {
                return Response.json({ error: "Nama, email, dan wilayah wajib diisi." }, { status: 400 });
            }
            const result = await updateKader(id, {
                name,
                email,
                wilayah_id: wilayahId,
                password,
            });
            return Response.json(result);
        }
        if (intent === "update-wilayah") {
            const id = String(formData.get("id") || "").trim();
            const data = JSON.parse(String(formData.get("data") || "{}"));
            const namaWilayah = String(data.nama_wilayah || "").trim();
            const tipe = String(data.tipe || "desa") as "desa" | "kelurahan" | "puskesmas";
            if (!id) {
                return Response.json({ error: "ID wilayah wajib diisi." }, { status: 400 });
            }
            if (!namaWilayah) {
                return Response.json({ error: "Nama wilayah wajib diisi." }, { status: 400 });
            }
            const result = await updateWilayah(id, {
                nama_wilayah: namaWilayah,
                tipe,
            });
            return Response.json(result);
        }
        if (intent === "delete-kader") {
            const id = formData.get("id") as string;
            await deleteKader(id);
            return Response.json({ success: true });
        }
        if (intent === "create-informasi") {
            const data = JSON.parse(formData.get("data") as string);
            const kategori = String(data.kategori || "").toLowerCase();
            if (!isValidInformasiCategory(kategori)) {
                return Response.json({ error: "Kategori informasi tidak valid." }, { status: 400 });
            }
            if (!data.judul || !String(data.judul).trim() || !data.konten || !String(data.konten).trim()) {
                return Response.json({ error: "Judul dan konten wajib diisi." }, { status: 400 });
            }
            const result = await informasiService.create({
                judul: String(data.judul).trim(),
                kategori,
                konten: String(data.konten).trim(),
                gambar_data_url: data.gambar_data_url ? String(data.gambar_data_url) : null,
                tanggal_kegiatan: data.tanggal_kegiatan ? new Date(data.tanggal_kegiatan) : null,
                lokasi: data.lokasi ? String(data.lokasi).trim() : null,
                wilayah_id: user.wilayah_id || null,
                created_by_user_id: user.id,
                created_by_role: "puskesmas",
                is_published: true,
                is_pinned: Boolean(data.is_pinned),
            });
            return Response.json(result);
        }

        if (intent === "update-informasi") {
            const data = JSON.parse(formData.get("data") as string);
            const informasiId = String(data.id || "");
            if (!informasiId) {
                return Response.json({ error: "ID informasi wajib diisi." }, { status: 400 });
            }
            const allowed = await ensureCanManageInformasi(informasiId);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            const kategori = String(data.kategori || "").toLowerCase();
            if (!isValidInformasiCategory(kategori)) {
                return Response.json({ error: "Kategori informasi tidak valid." }, { status: 400 });
            }
            if (!data.judul || !String(data.judul).trim() || !data.konten || !String(data.konten).trim()) {
                return Response.json({ error: "Judul dan konten wajib diisi." }, { status: 400 });
            }
            const result = await informasiService.updateById(informasiId, {
                judul: String(data.judul).trim(),
                kategori,
                konten: String(data.konten).trim(),
                gambar_data_url: data.gambar_data_url ? String(data.gambar_data_url) : null,
                tanggal_kegiatan: data.tanggal_kegiatan ? new Date(data.tanggal_kegiatan) : null,
                lokasi: data.lokasi ? String(data.lokasi).trim() : null,
                is_pinned: Boolean(data.is_pinned),
            });
            return Response.json(result);
        }

        if (intent === "delete-informasi") {
            const informasiId = String(formData.get("id") || "");
            if (!informasiId) {
                return Response.json({ error: "ID informasi wajib diisi." }, { status: 400 });
            }
            const allowed = await ensureCanManageInformasi(informasiId);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            await informasiService.deleteById(informasiId);
            return Response.json({ success: true });
        }

        return Response.json({ error: "Unknown intent" }, { status: 400 });
    } catch (error) {
        console.error("Puskesmas dashboard action error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
