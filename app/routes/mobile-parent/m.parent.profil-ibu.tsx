import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/m.parent.profil-ibu";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "./m.parent.profil-ibu.module.css";

type ProfilIbu = {
  id: string;
  user_id: string;
  nik: string;
  alamat: string;
  tanggal_lahir: string;
  tinggi_badan_cm: number;
  berat_badan_kg: number;
  golongan_darah?: string | null;
  riwayat_penyakit?: string | null;
};

const profilIbuApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getProfilIbu: () => profilIbuApi.fetchWithError("/api/parent/profil-ibu"),
  submitProfilIbu: (formData: FormData) =>
    profilIbuApi.fetchWithError("/api/parent/profil-ibu", {
      method: "POST",
      body: formData,
    }),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profil Ibu - Anting" },
    { name: "description", content: "Lengkapi profil ibu sebelum input data anak." },
  ];
}

export default function MobileParentProfilIbuPage() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nik, setNik] = useState("");
  const [alamat, setAlamat] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("");

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

        const res = await profilIbuApi.getProfilIbu();
        const profilIbu = res?.profilIbu as ProfilIbu | null;
        if (profilIbu) {
          setNik(profilIbu.nik || "");
          setAlamat(profilIbu.alamat || "");
          setTanggalLahir(profilIbu.tanggal_lahir?.slice(0, 10) || "");
          setTinggiBadan(String(profilIbu.tinggi_badan_cm ?? ""));
          setBeratBadan(String(profilIbu.berat_badan_kg ?? ""));
          setGolonganDarah(profilIbu.golongan_darah || "");
          setRiwayatPenyakit(profilIbu.riwayat_penyakit || "");
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Gagal memuat profil",
          description: "Coba lagi beberapa saat lagi.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };
    load();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nikSanitized = nik.replace(/\D/g, "");
    if (nikSanitized.length !== 16) {
      toast({
        title: "NIK tidak valid",
        description: "NIK harus 16 digit angka.",
        variant: "destructive",
      });
      return;
    }
    if (!alamat.trim() || !tanggalLahir || !tinggiBadan || !beratBadan) {
      toast({
        title: "Data belum lengkap",
        description: "Lengkapi data wajib Profil Ibu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("nik", nikSanitized);
      formData.append("alamat", alamat.trim());
      formData.append("tanggal_lahir", tanggalLahir);
      formData.append("tinggi_badan_cm", tinggiBadan);
      formData.append("berat_badan_kg", beratBadan);
      formData.append("golongan_darah", golonganDarah.trim());
      formData.append("riwayat_penyakit", riwayatPenyakit.trim());
      await profilIbuApi.submitProfilIbu(formData);

      toast({
        title: "Berhasil",
        description: "Profil Ibu berhasil disimpan.",
      });
      navigate("/m/parent/anak/new");
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan",
        description: error?.message || "Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth || loadingProfile) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/m/parent/dashboard" className={styles.backButton}>
          <span className={styles.icon}>arrow_back</span>
        </Link>
        <div>
          <h1 className={styles.title}>Profil Ibu</h1>
          <p className={styles.subtitle}>Lengkapi data ibu sebelum menambahkan data anak.</p>
        </div>
      </header>

      <main className={styles.main}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="nik-ibu-mobile">
              NIK (16 digit)
            </label>
            <input
              id="nik-ibu-mobile"
              className={styles.formInput}
              inputMode="numeric"
              pattern="[0-9]{16}"
              maxLength={16}
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
              placeholder="3201xxxxxxxxxxxx"
              required
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="alamat-ibu-mobile">
              Alamat
            </label>
            <textarea
              id="alamat-ibu-mobile"
              className={styles.formTextarea}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Alamat lengkap ibu"
              required
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="tanggal-lahir-ibu-mobile">
                Tanggal Lahir
              </label>
              <input
                id="tanggal-lahir-ibu-mobile"
                type="date"
                className={styles.formInput}
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="golongan-darah-ibu-mobile">
                Golongan Darah
              </label>
              <select
                id="golongan-darah-ibu-mobile"
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
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="tinggi-badan-ibu-mobile">
                Tinggi Badan (cm)
              </label>
              <input
                id="tinggi-badan-ibu-mobile"
                type="number"
                min="1"
                step="0.1"
                className={styles.formInput}
                value={tinggiBadan}
                onChange={(e) => setTinggiBadan(e.target.value)}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="berat-badan-ibu-mobile">
                Berat Badan (kg)
              </label>
              <input
                id="berat-badan-ibu-mobile"
                type="number"
                min="1"
                step="0.1"
                className={styles.formInput}
                value={beratBadan}
                onChange={(e) => setBeratBadan(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="riwayat-penyakit-ibu-mobile">
              Riwayat Penyakit (opsional)
            </label>
            <textarea
              id="riwayat-penyakit-ibu-mobile"
              className={styles.formTextarea}
              value={riwayatPenyakit}
              onChange={(e) => setRiwayatPenyakit(e.target.value)}
              placeholder="Contoh: hipertensi, diabetes, alergi tertentu"
            />
          </div>

          <button className={styles.primaryBtn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Profil Ibu"}
          </button>
        </form>
      </main>
      <MobileParentNav />
    </div>
  );
}
