import { cadreService } from "~/db/services/cadre.service";
import { getAuthUser } from "~/utils/auth.server";
import { pertumbuhanService } from "~/db/services/pertumbuhan.service";
import { imunisasiService } from "~/db/services/imunisasi.service";
import { profilAnakService } from "~/db/services/profil-anak.service";
import { intervensiGiziService } from "~/db/services/intervensi-gizi.service";
import { kunjunganReminderService } from "~/db/services/kunjungan-reminder.service";
import { informasiService, isValidInformasiCategory } from "~/db/services/informasi.service";

export async function loader({ request }: { request: Request }) {
    const user = await getAuthUser(request);
    if (!user || user.role !== "kader") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const wilayahId = url.searchParams.get("wilayahId") || user.wilayah_id || "";

    try {
        if (action === "anak") {
            const data = await cadreService.getAnakByWilayah(wilayahId);
            return Response.json(data);
        }
        if (action === "informasi") {
            const data = await informasiService.listForRole({
                wilayahId,
                includeUnpublished: true,
                limit: 200,
            });
            return Response.json(data);
        }
        if (action === "stats") {
            const data = await cadreService.getCadreStats(wilayahId);
            return Response.json(data);
        }
        if (action === "recaps") {
            const data = await cadreService.getRecentMonthlyRecaps(wilayahId);
            return Response.json(data);
        }
        if (action === "anak-detail") {
            const anakId = url.searchParams.get("anakId") || "";
            if (!anakId) {
                return Response.json({ error: "anakId is required" }, { status: 400 });
            }

            const anakList = await cadreService.getAnakByWilayah(wilayahId);
            const anak = anakList.find((a: any) => a.id === anakId);
            if (!anak) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }

            const [pertumbuhan, imunisasi, profilAnak, intervensi] = await Promise.all([
                pertumbuhanService.getPertumbuhanByAnakId(anakId),
                imunisasiService.getImunisasiByAnakId(anakId),
                profilAnakService.getByAnakId(anakId),
                intervensiGiziService.getByAnakId(anakId),
            ]);
            return Response.json({ anak, pertumbuhan, imunisasi, profilAnak, intervensi });
        }

        // Default: return all data
        const [anakList, stats, recaps] = await Promise.all([
            cadreService.getAnakByWilayah(wilayahId),
            cadreService.getCadreStats(wilayahId),
            cadreService.getRecentMonthlyRecaps(wilayahId),
        ]);
        return Response.json({ anakList, stats, recaps, wilayahId });
    } catch (error) {
        console.error("Cadre dashboard API error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function action({ request }: { request: Request }) {
    const user = await getAuthUser(request);
    if (!user || user.role !== "kader") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent") as string;

    const { pertumbuhanService } = await import("~/db/services/pertumbuhan.service");
    const { imunisasiService } = await import("~/db/services/imunisasi.service");

    try {
        const ensureCanManageInformasi = async (informasiId: string) => {
            const info = await informasiService.getById(informasiId);
            if (!info) return false;
            return (
                info.created_by_user_id === user.id &&
                info.created_by_role === "kader" &&
                (info.wilayah_id || null) === (user.wilayah_id || null)
            );
        };

        const ensureAnakInWilayah = async (anakId: string) => {
            const wilayahId = user.wilayah_id || "";
            if (!anakId || !wilayahId) return false;
            const anakList = await cadreService.getAnakByWilayah(wilayahId);
            return anakList.some((a: any) => a.id === anakId);
        };

        if (intent === "create-pertumbuhan") {
            const rawData = JSON.parse(formData.get("data") as string);
            const allowed = await ensureAnakInWilayah(rawData.anak_id);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            const data = {
                anak_id: rawData.anak_id,
                tanggal_pengukuran: new Date(rawData.tanggal_pengukuran),
                berat_badan: Number(rawData.berat_badan),
                tinggi_badan: Number(rawData.tinggi_badan),
                lila_cm: rawData.lila_cm !== undefined && rawData.lila_cm !== null && rawData.lila_cm !== ""
                    ? Number(rawData.lila_cm)
                    : null,
            };
            console.log("Cadre creating pertumbuhan with data:", JSON.stringify(data));
            const result = await pertumbuhanService.createPertumbuhan(data);
            console.log("Cadre pertumbuhan created:", result.id);
            return Response.json(result);
        }

        if (intent === "create-imunisasi") {
            const rawData = JSON.parse(formData.get("data") as string);
            const allowed = await ensureAnakInWilayah(rawData.anak_id);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            const data = {
                anak_id: rawData.anak_id,
                tanggal: new Date(rawData.tanggal),
                nama_vaksin: rawData.nama_imunisasi || rawData.nama_vaksin,
                keterangan: rawData.keterangan || ""
            };
            console.log("Cadre creating imunisasi with data:", data);
            const result = await imunisasiService.createImunisasi(data);
            return Response.json(result);
        }

        if (intent === "create-intervensi") {
            const rawData = JSON.parse(formData.get("data") as string);
            const allowed = await ensureAnakInWilayah(rawData.anak_id);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            const data = {
                anak_id: rawData.anak_id,
                tanggal: new Date(rawData.tanggal),
                jenis: rawData.jenis as "PKMK" | "VITAMIN" | "ZINC",
                produk: rawData.produk || "",
                dosis: rawData.dosis || "",
                catatan: rawData.catatan || "",
            };
            const result = await intervensiGiziService.createIntervensi(data);
            return Response.json(result);
        }

        if (intent === "set-kunjungan-reminder") {
            const rawData = JSON.parse(formData.get("data") as string);
            const allowed = await ensureAnakInWilayah(rawData.anak_id);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }

            const result = await kunjunganReminderService.upsertReminder({
                anak_id: rawData.anak_id,
                tanggal_kunjungan: new Date(rawData.tanggal_kunjungan),
                created_by_kader_id: user.id,
            });
            return Response.json(result);
        }

        if (intent === "clear-kunjungan-reminder") {
            const anakId = (formData.get("anak_id") as string) || "";
            const allowed = await ensureAnakInWilayah(anakId);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }

            await kunjunganReminderService.deleteByAnakId(anakId);
            return Response.json({ success: true });
        }

        if (intent === "create-informasi") {
            const rawData = JSON.parse(formData.get("data") as string);
            const kategori = String(rawData.kategori || "").toLowerCase();
            if (!isValidInformasiCategory(kategori)) {
                return Response.json({ error: "Kategori informasi tidak valid." }, { status: 400 });
            }
            if (!rawData.judul || !String(rawData.judul).trim() || !rawData.konten || !String(rawData.konten).trim()) {
                return Response.json({ error: "Judul dan konten wajib diisi." }, { status: 400 });
            }
            const result = await informasiService.create({
                judul: String(rawData.judul).trim(),
                kategori,
                konten: String(rawData.konten).trim(),
                gambar_data_url: rawData.gambar_data_url ? String(rawData.gambar_data_url) : null,
                tanggal_kegiatan: rawData.tanggal_kegiatan ? new Date(rawData.tanggal_kegiatan) : null,
                lokasi: rawData.lokasi ? String(rawData.lokasi).trim() : null,
                wilayah_id: user.wilayah_id || null,
                created_by_user_id: user.id,
                created_by_role: "kader",
                is_published: true,
                is_pinned: false,
            });
            return Response.json(result);
        }

        if (intent === "update-informasi") {
            const rawData = JSON.parse(formData.get("data") as string);
            const informasiId = String(rawData.id || "");
            if (!informasiId) {
                return Response.json({ error: "ID informasi wajib diisi." }, { status: 400 });
            }
            const allowed = await ensureCanManageInformasi(informasiId);
            if (!allowed) {
                return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            const kategori = String(rawData.kategori || "").toLowerCase();
            if (!isValidInformasiCategory(kategori)) {
                return Response.json({ error: "Kategori informasi tidak valid." }, { status: 400 });
            }
            if (!rawData.judul || !String(rawData.judul).trim() || !rawData.konten || !String(rawData.konten).trim()) {
                return Response.json({ error: "Judul dan konten wajib diisi." }, { status: 400 });
            }
            const result = await informasiService.updateById(informasiId, {
                judul: String(rawData.judul).trim(),
                kategori,
                konten: String(rawData.konten).trim(),
                gambar_data_url: rawData.gambar_data_url ? String(rawData.gambar_data_url) : null,
                tanggal_kegiatan: rawData.tanggal_kegiatan ? new Date(rawData.tanggal_kegiatan) : null,
                lokasi: rawData.lokasi ? String(rawData.lokasi).trim() : null,
                is_pinned: false,
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
        console.error("Cadre dashboard action error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
