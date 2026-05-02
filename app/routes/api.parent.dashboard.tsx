import { dashboardService } from "~/db/services/dashboard.service";
import { anakService } from "~/db/services/anak.service";
import { pertumbuhanService } from "~/db/services/pertumbuhan.service";
import { imunisasiService } from "~/db/services/imunisasi.service";
import { profilIbuService } from "~/db/services/profil-ibu.service";
import { intervensiGiziService } from "~/db/services/intervensi-gizi.service";
import { informasiService } from "~/db/services/informasi.service";
import { getAuthUser } from "~/utils/auth.server";

export async function loader({ request }: { request: Request }) {
    const user = await getAuthUser(request);
    if (!user || user.role !== "orang_tua") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
        if (action === "stats") {
            const stats = await dashboardService.getDashboardStats(user.id);
            return Response.json(stats);
        }
        if (action === "summaries") {
            const summaries = await dashboardService.getAnakSummaries(user.id);
            return Response.json(summaries);
        }
        if (action === "anak") {
            const anakList = await anakService.getAnakByUserId(user.id);
            return Response.json(anakList);
        }
        if (action === "growth-trend") {
            const anakId = url.searchParams.get("anakId") || "";
            const count = parseInt(url.searchParams.get("count") || "10");
            const trend = await dashboardService.getGrowthTrend(anakId, count);
            return Response.json(trend);
        }
        if (action === "pertumbuhan") {
            const anakId = url.searchParams.get("anakId") || "";
            const data = await pertumbuhanService.getPertumbuhanByAnakId(anakId);
            return Response.json(data);
        }
        if (action === "imunisasi") {
            const anakId = url.searchParams.get("anakId") || "";
            const data = await imunisasiService.getImunisasiByAnakId(anakId);
            return Response.json(data);
        }
        if (action === "intervensi") {
            const anakId = url.searchParams.get("anakId") || "";
            const data = await intervensiGiziService.getByAnakId(anakId);
            return Response.json(data);
        }
        if (action === "informasi") {
            const data = await informasiService.listForRole({
                wilayahId: user.wilayah_id,
                includeUnpublished: false,
                limit: 200,
            });
            return Response.json(data);
        }

        // Default: return all dashboard data
        const [stats, summaries, anakList] = await Promise.all([
            dashboardService.getDashboardStats(user.id),
            dashboardService.getAnakSummaries(user.id),
            anakService.getAnakByUserId(user.id),
        ]);
        return Response.json({ stats, summaries, anakList });
    } catch (error) {
        console.error("Parent dashboard API error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function action({ request }: { request: Request }) {
    const user = await getAuthUser(request);
    if (!user || user.role !== "orang_tua") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent") as string;

    try {
        if (intent === "create-anak") {
            const hasProfilIbu = await profilIbuService.hasProfile(user.id);
            if (!hasProfilIbu) {
                return Response.json({ error: "Lengkapi Profil Ibu sebelum menambah data anak." }, { status: 400 });
            }
            const data = {
                nama: formData.get("nama") as string,
                tanggal_lahir: new Date(formData.get("tanggal_lahir") as string),
                jenis_kelamin: formData.get("jenis_kelamin") as any,
                user_id: user.id,
            };
            console.log("Creating anak with data:", data);
            const result = await anakService.createAnak(data);
            return Response.json(result);
        }
        if (intent === "update-anak") {
            const id = formData.get("id") as string;
            const data = {
                nama: formData.get("nama") as string,
                tanggal_lahir: new Date(formData.get("tanggal_lahir") as string),
                jenis_kelamin: formData.get("jenis_kelamin") as any,
            };
            console.log("Updating anak", id, "with data:", data);
            const result = await anakService.updateAnak(id, data);
            return Response.json(result);
        }
        if (intent === "delete-anak") {
            const id = formData.get("id") as string;
            await anakService.deleteAnak(id);
            return Response.json({ success: true });
        }
        if (intent === "create-pertumbuhan") {
            const rawData = JSON.parse(formData.get("data") as string);
            const data = {
                anak_id: rawData.anak_id,
                tanggal_pengukuran: new Date(rawData.tanggal_pengukuran),
                berat_badan: Number(rawData.berat_badan),
                tinggi_badan: Number(rawData.tinggi_badan),
                lila_cm: rawData.lila_cm !== undefined && rawData.lila_cm !== null && rawData.lila_cm !== ""
                    ? Number(rawData.lila_cm)
                    : null,
            };
            console.log("Creating pertumbuhan with data:", JSON.stringify(data));
            const result = await pertumbuhanService.createPertumbuhan(data);
            console.log("Pertumbuhan created:", result.id);
            return Response.json(result);
        }
        if (intent === "update-pertumbuhan") {
            const id = formData.get("id") as string;
            const rawData = JSON.parse(formData.get("data") as string);
            const data: any = {};
            if (rawData.tanggal_pengukuran) data.tanggal_pengukuran = new Date(rawData.tanggal_pengukuran);
            if (rawData.berat_badan !== undefined) data.berat_badan = Number(rawData.berat_badan);
            if (rawData.tinggi_badan !== undefined) data.tinggi_badan = Number(rawData.tinggi_badan);
            if (rawData.lila_cm !== undefined) {
                data.lila_cm = rawData.lila_cm === null || rawData.lila_cm === "" ? null : Number(rawData.lila_cm);
            }
            console.log("Updating pertumbuhan", id, "with data:", JSON.stringify(data));
            const result = await pertumbuhanService.updatePertumbuhan(id, data);
            return Response.json(result);
        }
        if (intent === "delete-pertumbuhan") {
            const id = formData.get("id") as string;
            await pertumbuhanService.deletePertumbuhan(id);
            return Response.json({ success: true });
        }
        if (intent === "create-imunisasi") {
            const rawData = JSON.parse(formData.get("data") as string);
            // Map nama_imunisasi to nama_vaksin and convert date
            const data = {
                anak_id: rawData.anak_id,
                tanggal: new Date(rawData.tanggal),
                nama_vaksin: rawData.nama_imunisasi || rawData.nama_vaksin,
                keterangan: rawData.keterangan || ""
            };
            console.log("Creating imunisasi with data:", data);
            const result = await imunisasiService.createImunisasi(data);
            return Response.json(result);
        }
        if (intent === "create-intervensi") {
            const rawData = JSON.parse(formData.get("data") as string);
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
        if (intent === "update-imunisasi") {
            const id = formData.get("id") as string;
            const rawData = JSON.parse(formData.get("data") as string);
            // Map and convert
            const data: any = {};
            if (rawData.tanggal) data.tanggal = new Date(rawData.tanggal);
            if (rawData.nama_imunisasi) data.nama_vaksin = rawData.nama_imunisasi;
            if (rawData.nama_vaksin) data.nama_vaksin = rawData.nama_vaksin;
            if (rawData.keterangan !== undefined) data.keterangan = rawData.keterangan;

            console.log("Updating imunisasi", id, "with data:", data);
            const result = await imunisasiService.updateImunisasi(id, data);
            return Response.json(result);
        }
        if (intent === "delete-imunisasi") {
            const id = formData.get("id") as string;
            await imunisasiService.deleteImunisasi(id);
            return Response.json({ success: true });
        }

        return Response.json({ error: "Unknown intent" }, { status: 400 });
    } catch (error) {
        console.error("Parent dashboard action error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
