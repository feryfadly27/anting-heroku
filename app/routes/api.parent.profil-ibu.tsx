import { getAuthUser } from "~/utils/auth.server";
import { profilIbuService } from "~/db/services/profil-ibu.service";

function validateNik(nik: string) {
  return /^\d{16}$/.test(nik);
}

const VALID_BLOOD_TYPES = new Set(["A", "B", "AB", "O", "belum_tahu"]);

export async function loader({ request }: { request: Request }) {
  const user = await getAuthUser(request);
  if (!user || user.role !== "orang_tua") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profilIbu = await profilIbuService.getByUserId(user.id);
    return Response.json({ profilIbu });
  } catch (error) {
    console.error("Profil ibu loader error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const user = await getAuthUser(request);
  if (!user || user.role !== "orang_tua") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const nik = String(formData.get("nik") || "").trim();
    const jalan = String(formData.get("jalan") || "").trim();
    const rt = String(formData.get("rt") || "").trim();
    const rw = String(formData.get("rw") || "").trim();
    const kelurahan = String(formData.get("kelurahan") || "").trim();
    const kecamatan = String(formData.get("kecamatan") || "").trim();
    const kabupatenKota = String(formData.get("kabupaten_kota") || "").trim();
    const tanggalLahirRaw = String(formData.get("tanggal_lahir") || "").trim();
    const tinggiBadanRaw = String(formData.get("tinggi_badan_cm") || "").trim();
    const beratBadanRaw = String(formData.get("berat_badan_kg") || "").trim();
    const golonganDarah = String(formData.get("golongan_darah") || "").trim();
    const riwayatPenyakit = String(formData.get("riwayat_penyakit") || "").trim();

    if (
      !nik ||
      !jalan ||
      !rt ||
      !rw ||
      !kelurahan ||
      !kecamatan ||
      !kabupatenKota ||
      !tanggalLahirRaw ||
      !tinggiBadanRaw ||
      !beratBadanRaw
    ) {
      return Response.json({ error: "Data wajib belum lengkap." }, { status: 400 });
    }

    if (!validateNik(nik)) {
      return Response.json({ error: "NIK harus 16 digit angka." }, { status: 400 });
    }

    const tanggalLahir = new Date(tanggalLahirRaw);
    if (Number.isNaN(tanggalLahir.getTime())) {
      return Response.json({ error: "Tanggal lahir tidak valid." }, { status: 400 });
    }

    const tinggiBadan = Number(tinggiBadanRaw);
    const beratBadan = Number(beratBadanRaw);
    if (tinggiBadan <= 0 || beratBadan <= 0) {
      return Response.json({ error: "Tinggi badan dan berat badan harus lebih dari 0." }, { status: 400 });
    }

    if (golonganDarah && !VALID_BLOOD_TYPES.has(golonganDarah)) {
      return Response.json({ error: "Golongan darah tidak valid." }, { status: 400 });
    }

    const alamat = `${jalan}, RT ${rt} / RW ${rw}, Kelurahan ${kelurahan}, Kecamatan ${kecamatan}, ${kabupatenKota}`;

    const profilIbu = await profilIbuService.upsertProfilIbu({
      user_id: user.id,
      nik,
      alamat,
      rt,
      rw,
      kelurahan,
      kecamatan,
      kabupaten_kota: kabupatenKota,
      tanggal_lahir: tanggalLahir,
      tinggi_badan_cm: tinggiBadan,
      berat_badan_kg: beratBadan,
      golongan_darah: golonganDarah || null,
      riwayat_penyakit: riwayatPenyakit || null,
    });

    return Response.json({ profilIbu });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "NIK sudah terdaftar." }, { status: 409 });
    }
    console.error("Profil ibu action error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
