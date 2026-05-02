import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/m.parent.anak";
import { getCurrentUser } from "~/utils/auth";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import { toast } from "~/hooks/use-toast";
import styles from "./m.parent.anak.module.css";

const parentApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getSummaries: () => parentApi.fetchWithError("/api/parent/dashboard?action=summaries"),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Daftar Anak - Anting" },
    { name: "description", content: "Daftar profil anak pada Anting versi mobile" },
  ];
}

function calculateAge(tanggalLahir: string): string {
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
  if (diffMonths < 12) return `${diffMonths} bulan`;
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  return months > 0 ? `${years} thn ${months} bln` : `${years} tahun`;
}

function getStatusLabel(summary: any): string {
  if (!summary.latestPertumbuhan) return "Belum ada data";
  if (summary.needsAttention) return "Perlu Perhatian";
  return "Normal";
}

function getStatusType(summary: any): "normal" | "warning" | "danger" {
  if (!summary.latestPertumbuhan) return "normal";
  if (summary.needsAttention) {
    const p = summary.latestPertumbuhan;
    if (
      (p.zscore_tbu !== null && p.zscore_tbu < -3) ||
      (p.zscore_bbu !== null && p.zscore_bbu < -3) ||
      (p.zscore_bbtb !== null && p.zscore_bbtb < -3)
    ) {
      return "danger";
    }
    return "warning";
  }
  return "normal";
}

export default function MobileParentAnakPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [anakSummaries, setAnakSummaries] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    getCurrentUser().then((user) => {
      if (!isMounted) return;
      if (!user || user.role !== "orang_tua") {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(user.id);
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const summaries = await parentApi.getSummaries();
        setAnakSummaries(summaries);
      } catch (error) {
        console.error(error);
        setLoadError("Gagal memuat daftar anak. Coba lagi.");
        toast({ title: "Error", description: "Gagal memuat daftar anak", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const isMale = (jenisKelamin: string | null | undefined) => jenisKelamin === "laki_laki" || jenisKelamin === "L";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Daftar Anak</h1>
          <Link to="/m/parent/anak/new" className={styles.headerAddBtn}>
            + Tambah Anak
          </Link>
        </div>
        <p className={styles.subtitle}>Pilih anak untuk melihat profil dan riwayat lengkap.</p>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner}></div>
          </div>
        ) : loadError ? (
          <section className={styles.errorCard}>
            <p>{loadError}</p>
            <button className={styles.primaryBtn} onClick={() => window.location.reload()}>
              Coba Lagi
            </button>
          </section>
        ) : anakSummaries.length === 0 ? (
          <section className={styles.emptyCard}>
            <p>Belum ada data anak.</p>
            <Link to="/m/parent/anak/new" className={styles.primaryBtn}>
              Tambah Anak
            </Link>
          </section>
        ) : (
          <section className={styles.listSection}>
            {anakSummaries.map((s: any) => {
              const statusType = getStatusType(s);
              return (
                <Link key={s.anak.id} className={styles.childListItem} data-border={statusType} to={`/m/parent/anak/${s.anak.id}`}>
                  <div className={styles.childListLeft}>
                    <div className={styles.childListIcon}>
                      <span className={styles.icon}>{isMale(s.anak.jenis_kelamin) ? "face" : "face_3"}</span>
                    </div>
                    <div>
                      <p className={styles.childListName}>{s.anak.nama}</p>
                      <p className={styles.childListAge}>
                        {calculateAge(s.anak.tanggal_lahir)} • {s.latestPertumbuhan ? `${s.latestPertumbuhan.berat_badan} kg` : "Belum diukur"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.childListBadge} data-status={statusType}>
                    {getStatusLabel(s)}
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>

      <MobileParentNav />
    </div>
  );
}
