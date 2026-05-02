import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/m.parent.anak.$anakId.imunisasi.new";
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
  return [{ title: "Tambah Imunisasi - Anting" }];
}

export default function MobileAddImunisasiPage() {
  const navigate = useNavigate();
  const { anakId } = useParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [namaImunisasi, setNamaImunisasi] = useState("");
  const [keterangan, setKeterangan] = useState("");

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

    if (!namaImunisasi.trim() || !tanggal) {
      toast({ title: "Data belum lengkap", description: "Nama imunisasi dan tanggal wajib diisi.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("intent", "create-imunisasi");
      fd.append(
        "data",
        JSON.stringify({
          anak_id: anakId,
          tanggal,
          nama_imunisasi: namaImunisasi.trim(),
          keterangan: keterangan.trim(),
        })
      );
      await parentApi.submitAction(fd);
      toast({ title: "Berhasil", description: "Catatan imunisasi berhasil ditambahkan." });
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
          <h1 className={styles.title}>Tambah Imunisasi</h1>
          <p className={styles.subtitle}>Tambah catatan imunisasi anak</p>
        </div>
      </header>

      <main className={styles.main}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Nama Imunisasi</label>
            <input
              className={styles.formInput}
              value={namaImunisasi}
              onChange={(e) => setNamaImunisasi(e.target.value)}
              placeholder="Contoh: BCG, DPT, Polio"
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Tanggal Imunisasi</label>
            <input className={styles.formInput} type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Keterangan (opsional)</label>
            <input
              className={styles.formInput}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: dosis 1"
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
