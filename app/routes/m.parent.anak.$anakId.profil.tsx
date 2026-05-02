import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/m.parent.anak.$anakId.profil";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "./m.parent.anak.profil.module.css";

type ProfilAnak = {
  id: string;
  anak_id: string;
  nik_anak?: string | null;
  tempat_lahir?: string | null;
  panjang_lahir_cm?: number | null;
  berat_lahir_kg?: number | null;
  golongan_darah?: string | null;
  alergi?: string | null;
  catatan_kesehatan?: string | null;
};

const api = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getAnakSummaries: () => api.fetchWithError("/api/parent/dashboard?action=summaries"),
  getProfilAnak: (anakId: string) => api.fetchWithError(`/api/parent/profil-anak?anakId=${anakId}`),
  saveProfilAnak: (formData: FormData) =>
    api.fetchWithError("/api/parent/profil-anak", {
      method: "POST",
      body: formData,
    }),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profil Detail Anak - Anting" },
    { name: "description", content: "Data profil anak yang lebih detail." },
  ];
}

export default function MobileAnakProfilDetailPage() {
  const navigate = useNavigate();
  const { anakId } = useParams();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [namaAnak, setNamaAnak] = useState("");

  const [nikAnak, setNikAnak] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [panjangLahir, setPanjangLahir] = useState("");
  const [beratLahir, setBeratLahir] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("");
  const [alergi, setAlergi] = useState("");
  const [catatanKesehatan, setCatatanKesehatan] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const user = await getCurrentUser();
        if (!isMounted) return;
        if (!user || user.role !== "orang_tua") {
          navigate("/login", { replace: true });
          return;
        }
        setCheckingAuth(false);

        if (!anakId) return;

        const [summaryRes, profilRes] = await Promise.all([api.getAnakSummaries(), api.getProfilAnak(anakId)]);
        const selected = (summaryRes || []).find((s: any) => s.anak.id === anakId);
        if (!selected) {
          toast({ title: "Data tidak ditemukan", description: "Anak tidak ditemukan.", variant: "destructive" });
          navigate("/m/parent/anak");
          return;
        }
        setNamaAnak(selected.anak.nama);

        const profilAnak = profilRes?.profilAnak as ProfilAnak | null;
        if (profilAnak) {
          setNikAnak(profilAnak.nik_anak || "");
          setTempatLahir(profilAnak.tempat_lahir || "");
          setPanjangLahir(profilAnak.panjang_lahir_cm ? String(profilAnak.panjang_lahir_cm) : "");
          setBeratLahir(profilAnak.berat_lahir_kg ? String(profilAnak.berat_lahir_kg) : "");
          setGolonganDarah(profilAnak.golongan_darah || "");
          setAlergi(profilAnak.alergi || "");
          setCatatanKesehatan(profilAnak.catatan_kesehatan || "");
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Gagal memuat data", description: "Silakan coba lagi.", variant: "destructive" });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();

    return () => {
      isMounted = false;
    };
  }, [navigate, anakId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!anakId) return;

    const nikSanitized = nikAnak.replace(/\D/g, "");
    if (nikSanitized && nikSanitized.length !== 16) {
      toast({ title: "NIK Anak tidak valid", description: "NIK Anak harus 16 digit angka.", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);
      const fd = new FormData();
      fd.append("anak_id", anakId);
      fd.append("nik_anak", nikSanitized);
      fd.append("tempat_lahir", tempatLahir.trim());
      fd.append("panjang_lahir_cm", panjangLahir.trim());
      fd.append("berat_lahir_kg", beratLahir.trim());
      fd.append("golongan_darah", golonganDarah.trim());
      fd.append("alergi", alergi.trim());
      fd.append("catatan_kesehatan", catatanKesehatan.trim());
      await api.saveProfilAnak(fd);
      toast({ title: "Berhasil", description: "Profil anak berhasil disimpan." });
      navigate(`/m/parent/anak/${anakId}`);
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error?.message || "Silakan coba lagi.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingAuth || loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={anakId ? `/m/parent/anak/${anakId}` : "/m/parent/anak"} className={styles.backButton}>
          <span className={styles.icon}>arrow_back</span>
        </Link>
        <div>
          <h1 className={styles.title}>Profil Detail Anak</h1>
          <p className={styles.subtitle}>{namaAnak || "Anak"}</p>
        </div>
      </header>

      <main className={styles.main}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="nik-anak">
              NIK Anak
            </label>
            <input
              id="nik-anak"
              className={styles.formInput}
              inputMode="numeric"
              maxLength={16}
              value={nikAnak}
              onChange={(e) => setNikAnak(e.target.value.replace(/\D/g, ""))}
              placeholder="Opsional, 16 digit"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="tempat-lahir-anak">
              Tempat Lahir
            </label>
            <input
              id="tempat-lahir-anak"
              className={styles.formInput}
              value={tempatLahir}
              onChange={(e) => setTempatLahir(e.target.value)}
              placeholder="Contoh: Bandung"
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="panjang-lahir-anak">
                Panjang Lahir (cm)
              </label>
              <input
                id="panjang-lahir-anak"
                className={styles.formInput}
                type="number"
                min="1"
                step="0.1"
                value={panjangLahir}
                onChange={(e) => setPanjangLahir(e.target.value)}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="berat-lahir-anak">
                Berat Lahir (kg)
              </label>
              <input
                id="berat-lahir-anak"
                className={styles.formInput}
                type="number"
                min="1"
                step="0.1"
                value={beratLahir}
                onChange={(e) => setBeratLahir(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="golongan-darah-anak">
              Golongan Darah
            </label>
            <select
              id="golongan-darah-anak"
              className={styles.formInput}
              value={golonganDarah}
              onChange={(e) => setGolonganDarah(e.target.value)}
            >
              <option value="">Pilih</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="alergi-anak">
              Alergi
            </label>
            <textarea
              id="alergi-anak"
              className={styles.formTextarea}
              value={alergi}
              onChange={(e) => setAlergi(e.target.value)}
              placeholder="Opsional"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="catatan-anak">
              Catatan Kesehatan
            </label>
            <textarea
              id="catatan-anak"
              className={styles.formTextarea}
              value={catatanKesehatan}
              onChange={(e) => setCatatanKesehatan(e.target.value)}
              placeholder="Opsional"
            />
          </div>

          <button className={styles.primaryBtn} type="submit" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Profil Anak"}
          </button>
        </form>
      </main>
      <MobileParentNav />
    </div>
  );
}
