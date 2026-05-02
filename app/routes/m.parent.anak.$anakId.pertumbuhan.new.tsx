import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/m.parent.anak.$anakId.pertumbuhan.new";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "./m.parent.anak.form.module.css";

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
};

export function meta({}: Route.MetaArgs) {
  return [{ title: "Tambah Pemeriksaan BB & TB - Anting" }];
}

export default function MobileAddPertumbuhanPage() {
  const navigate = useNavigate();
  const { anakId } = useParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [beratBadan, setBeratBadan] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [lilaCm, setLilaCm] = useState("");

  useEffect(() => {
    let isMounted = true;
    getCurrentUser().then((user) => {
      if (!isMounted) return;
      if (!user || user.role !== "orang_tua") {
        navigate("/login", { replace: true });
        return;
      }
      setCheckingAuth(false);
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!anakId) return;

    if (!beratBadan || !tinggiBadan || !tanggal) {
      toast({ title: "Data belum lengkap", description: "Semua field wajib diisi.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("intent", "create-pertumbuhan");
      fd.append(
        "data",
        JSON.stringify({
          anak_id: anakId,
          tanggal_pengukuran: tanggal,
          berat_badan: Number(beratBadan),
          tinggi_badan: Number(tinggiBadan),
          lila_cm: lilaCm ? Number(lilaCm) : null,
        })
      );
      await parentApi.submitAction(fd);
      toast({ title: "Berhasil", description: "Catatan pemeriksaan berhasil ditambahkan." });
      navigate(`/m/parent/anak/${anakId}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menyimpan", description: "Catatan belum bisa disimpan.", variant: "destructive" });
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
        <Link to={`/m/parent/anak/${anakId}`} className={styles.backButton}>
          <span className={styles.icon}>arrow_back</span>
        </Link>
        <div>
          <h1 className={styles.title}>Pemeriksaan BB & TB</h1>
          <p className={styles.subtitle}>Tambah catatan pertumbuhan anak</p>
        </div>
      </header>

      <main className={styles.main}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Tanggal Pengukuran</label>
            <input className={styles.formInput} type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Berat Badan (kg)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.01"
                min="0.1"
                value={beratBadan}
                onChange={(e) => setBeratBadan(e.target.value)}
                placeholder="Contoh: 12.5"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Tinggi Badan (cm)</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.01"
                min="10"
                value={tinggiBadan}
                onChange={(e) => setTinggiBadan(e.target.value)}
                placeholder="Contoh: 84"
              />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>LiLA (cm) - Opsional</label>
            <input
              className={styles.formInput}
              type="number"
              step="0.01"
              min="1"
              value={lilaCm}
              onChange={(e) => setLilaCm(e.target.value)}
              placeholder="Contoh: 13.2"
            />
          </div>

          <button className={styles.primaryBtn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
          </button>
        </form>
      </main>
      <MobileParentNav />
    </div>
  );
}
