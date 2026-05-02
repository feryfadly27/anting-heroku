import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/m.parent.anak.new";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "./m.parent.anak.new.module.css";

const parentApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  submitAction: (formData: FormData) =>
    parentApi.fetchWithError("/api/parent/dashboard", {
      method: "POST",
      body: formData,
    }),
  getProfilIbu: () => parentApi.fetchWithError("/api/parent/profil-ibu"),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tambah Anak - Anting" },
    { name: "description", content: "Tambah data anak dari aplikasi mobile Anting" },
  ];
}

export default function MobileAddAnakPage() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaAnak, setNamaAnak] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"laki_laki" | "perempuan">("laki_laki");

  useEffect(() => {
    let isMounted = true;
    getCurrentUser().then((user) => {
      if (!isMounted) return;
      if (!user || user.role !== "orang_tua") {
        navigate("/login", { replace: true });
        return;
      }
      parentApi
        .getProfilIbu()
        .then((res) => {
          if (!isMounted) return;
          if (!res?.profilIbu) {
            toast({
              title: "Lengkapi Profil Ibu dulu",
              description: "Sebelum menambah data anak, mohon isi Profil Ibu terlebih dahulu.",
            });
            navigate("/m/parent/profil-ibu", { replace: true });
            return;
          }
          setCheckingAuth(false);
        })
        .catch(() => {
          if (!isMounted) return;
          toast({
            title: "Gagal memuat data",
            description: "Tidak bisa memeriksa Profil Ibu. Coba lagi.",
            variant: "destructive",
          });
          navigate("/m/parent/profil-ibu", { replace: true });
        });
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!namaAnak.trim() || !tanggalLahir) {
      toast({
        title: "Data belum lengkap",
        description: "Nama anak dan tanggal lahir wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("intent", "create-anak");
      formData.append("nama", namaAnak.trim());
      formData.append("tanggal_lahir", tanggalLahir);
      formData.append("jenis_kelamin", jenisKelamin);
      await parentApi.submitAction(formData);

      toast({
        title: "Berhasil",
        description: "Data anak berhasil ditambahkan.",
      });
      navigate("/m/parent/dashboard");
    } catch (error) {
      console.error(error);
      toast({
        title: "Gagal menyimpan",
        description: "Data anak belum bisa disimpan. Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
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
          <h1 className={styles.title}>Tambah Anak</h1>
          <p className={styles.subtitle}>Isi data anak untuk mulai pemantauan</p>
        </div>
      </header>

      <main className={styles.main}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="nama-anak-mobile-new">
              Nama Anak
            </label>
            <input
              id="nama-anak-mobile-new"
              className={styles.formInput}
              value={namaAnak}
              onChange={(e) => setNamaAnak(e.target.value)}
              placeholder="Contoh: Aisyah"
              required
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="tanggal-lahir-mobile-new">
                Tanggal Lahir
              </label>
              <input
                id="tanggal-lahir-mobile-new"
                type="date"
                className={styles.formInput}
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="jenis-kelamin-mobile-new">
                Jenis Kelamin
              </label>
              <select
                id="jenis-kelamin-mobile-new"
                className={styles.formInput}
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as "laki_laki" | "perempuan")}
              >
                <option value="laki_laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <button className={styles.primaryBtn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Anak"}
          </button>
        </form>
      </main>
      <MobileParentNav />
    </div>
  );
}
