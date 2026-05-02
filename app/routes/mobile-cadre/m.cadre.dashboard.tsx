import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/m.cadre.dashboard";
import { getCurrentUser, logout } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileCadreNav } from "~/components/mobile-cadre-nav";
import styles from "./m.cadre.dashboard.module.css";

const cadreApi = {
  fetchWithError: async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getStats: (wilayahId: string) =>
    cadreApi.fetchWithError(`/api/cadre/dashboard?action=stats&wilayahId=${encodeURIComponent(wilayahId)}`),
};

type CadreStats = {
  total_anak: number;
  total_pemeriksaan_bulan_ini: number;
  anak_perlu_perhatian: number;
  persentase_normal: number;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Beranda Kader - Anting" },
    { name: "description", content: "Dashboard mobile kader posyandu" },
  ];
}

export default function MobileCadreDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Kader");
  const [wilayahId, setWilayahId] = useState<string | null>(null);
  const [stats, setStats] = useState<CadreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((user) => {
      if (!mounted) return;
      if (!user || user.role !== "kader") {
        navigate("/login", { replace: true });
        return;
      }
      if (user.name) setUserName(user.name);
      setWilayahId(user.wilayah_id || "wilayah_001");
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const loadStats = async (wid: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await cadreApi.getStats(wid);
      setStats(data);
    } catch (e) {
      console.error(e);
      setLoadError("Gagal memuat ringkasan. Cek koneksi dan database.");
      toast({ title: "Error", description: "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wilayahId) loadStats(wilayahId);
  }, [wilayahId]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (loading && !stats) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (loadError && !stats) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.errorCard}>
            <p>{loadError}</p>
            <button type="button" className={styles.retryBtn} onClick={() => wilayahId && loadStats(wilayahId)}>
              Coba Lagi
            </button>
          </div>
        </main>
        <MobileCadreNav />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerAvatar}>
          <span className={styles.iconFilled} style={{ fontSize: "1.75rem" }}>
            volunteer_activism
          </span>
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerName}>Halo, {userName}</h1>
          <p className={styles.headerSub}>Ringkasan wilayah binaan Anda</p>
        </div>
        <button type="button" className={styles.headerBtn} onClick={handleLogout} aria-label="Logout">
          <span className={styles.icon}>logout</span>
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.welcome}>
          <h2 className={styles.welcomeTitle}>Dashboard Kader</h2>
          <p className={styles.welcomeText}>
            Pantau anak di wilayah, catat pemeriksaan BB/TB dan imunisasi. Gunakan menu di bawah untuk navigasi cepat.
          </p>
        </section>

        {stats && (
          <section className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <span className={styles.icon}>groups</span>
              </div>
              <div>
                <span className={styles.statLabel}>Total Anak</span>
                <span className={styles.statValue}>{stats.total_anak}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} data-tone="ok">
                <span className={styles.icon}>calendar_month</span>
              </div>
              <div>
                <span className={styles.statLabel}>Pemeriksaan bulan ini</span>
                <span className={styles.statValue}>{stats.total_pemeriksaan_bulan_ini}</span>
              </div>
            </div>
            <div className={`${styles.statCard} ${stats.anak_perlu_perhatian > 0 ? styles.statCardAlert : ""}`}>
              <div className={styles.statIconWrap} data-tone="warn">
                <span className={styles.icon}>warning</span>
              </div>
              <div>
                <span className={styles.statLabel}>Perlu perhatian</span>
                <span className={styles.statValue}>{stats.anak_perlu_perhatian}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} data-tone="ok">
                <span className={styles.icon}>trending_up</span>
              </div>
              <div>
                <span className={styles.statLabel}>Pertumbuhan normal</span>
                <span className={styles.statValue}>{stats.persentase_normal}%</span>
              </div>
            </div>
          </section>
        )}

        <div className={styles.quickLinks}>
          <Link className={styles.quickLink} to="/m/cadre/anak">
            <span className={styles.icon}>list</span>
            Daftar anak
          </Link>
          <Link className={styles.quickLink} to="/m/cadre/rekap">
            <span className={styles.icon}>analytics</span>
            Rekap bulanan
          </Link>
        </div>
      </main>

      <MobileCadreNav />
    </div>
  );
}
