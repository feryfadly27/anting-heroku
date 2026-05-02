import { getAuthUser } from "~/utils/auth.server";
import { anakService } from "~/db/services/anak.service";
import { profilAnakService } from "~/db/services/profil-anak.service";

function isValidNik(value: string) {
  return /^\d{16}$/.test(value);
}

export async function loader({ request }: { request: Request }) {
  const user = await getAuthUser(request);
  if (!user || user.role !== "orang_tua") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const anakId = url.searchParams.get("anakId") || "";
  if (!anakId) {
    return Response.json({ error: "anakId wajib diisi." }, { status: 400 });
  }

  const anak = await anakService.getAnakById(anakId);
  if (!anak || anak.user_id !== user.id) {
    return Response.json({ error: "Data anak tidak ditemukan." }, { status: 404 });
  }

  try {
    const profilAnak = await profilAnakService.getByAnakId(anakId);
    return Response.json({ profilAnak });
  } catch (error) {
    console.error("Profil anak loader error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const user = await getAuthUser(request);
  if (!user || user.role !== "orang_tua") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const anakId = String(formData.get("anak_id") || "").trim();
  if (!anakId) {
    return Response.json({ error: "anak_id wajib diisi." }, { status: 400 });
  }

  const anak = await anakService.getAnakById(anakId);
  if (!anak || anak.user_id !== user.id) {
    return Response.json({ error: "Data anak tidak ditemukan." }, { status: 404 });
  }

  const nikAnak = String(formData.get("nik_anak") || "").trim();
  const tempatLahir = String(formData.get("tempat_lahir") || "").trim();
  const panjangLahirRaw = String(formData.get("panjang_lahir_cm") || "").trim();
  const beratLahirRaw = String(formData.get("berat_lahir_kg") || "").trim();
  const golonganDarah = String(formData.get("golongan_darah") || "").trim();
  const alergi = String(formData.get("alergi") || "").trim();
  const catatanKesehatan = String(formData.get("catatan_kesehatan") || "").trim();

  if (nikAnak && !isValidNik(nikAnak)) {
    return Response.json({ error: "NIK Anak harus 16 digit angka." }, { status: 400 });
  }

  const panjangLahir = panjangLahirRaw ? Number(panjangLahirRaw) : null;
  const beratLahir = beratLahirRaw ? Number(beratLahirRaw) : null;
  if ((panjangLahir !== null && panjangLahir <= 0) || (beratLahir !== null && beratLahir <= 0)) {
    return Response.json({ error: "Panjang/berat lahir harus lebih dari 0." }, { status: 400 });
  }

  try {
    const profilAnak = await profilAnakService.upsertProfilAnak({
      anak_id: anakId,
      nik_anak: nikAnak || null,
      tempat_lahir: tempatLahir || null,
      panjang_lahir_cm: panjangLahir,
      berat_lahir_kg: beratLahir,
      golongan_darah: golonganDarah || null,
      alergi: alergi || null,
      catatan_kesehatan: catatanKesehatan || null,
    });

    return Response.json({ profilAnak });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ error: "NIK Anak sudah terdaftar." }, { status: 409 });
    }
    console.error("Profil anak action error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
