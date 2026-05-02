import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Users, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import type { Route } from "./+types/cadre.dashboard";
import styles from "./cadre.dashboard.module.css";
import { DashboardLayout } from "~/components/dashboard-layout";
import { CadreAnakList } from "~/components/cadre-anak-list";
import { CadreMonthlyRecap } from "~/components/cadre-monthly-recap";
import { getCurrentUser } from "~/utils/auth";

// Types (replicate from cadre.service to avoid importing Prisma)
type AnakWithParentInfo = any;
type CadreStats = any;
type MonthlyStats = any;

// Client-safe API helpers
const cadreApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getAll: (wilayahId: string) => cadreApi.fetchWithError(`/api/cadre/dashboard?wilayahId=${wilayahId}`),
  getAnak: (wilayahId: string) => cadreApi.fetchWithError(`/api/cadre/dashboard?action=anak&wilayahId=${wilayahId}`),
  getStats: (wilayahId: string) => cadreApi.fetchWithError(`/api/cadre/dashboard?action=stats&wilayahId=${wilayahId}`),
  getRecaps: (wilayahId: string) => cadreApi.fetchWithError(`/api/cadre/dashboard?action=recaps&wilayahId=${wilayahId}`),
};

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dashboard Kader Posyandu - Anting" },
    {
      name: "description",
      content: "Dashboard untuk Kader Posyandu di Anting",
    },
  ];
}

export default function CadreDashboard() {
  const navigate = useNavigate();
  const [wilayahId, setWilayahId] = useState<string | null>(null);
  const [anakList, setAnakList] = useState<AnakWithParentInfo[]>([]);
  const [stats, setStats] = useState<CadreStats | null>(null);
  const [recaps, setRecaps] = useState<MonthlyStats[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Async auth check
    getCurrentUser().then(user => {
      if (!isMounted) return;

      if (!user || user.role !== "kader") {
        navigate("/login", { replace: true });
        return;
      }

      const userWilayahId = user.wilayah_id || "wilayah_001";
      setWilayahId(userWilayahId);
      loadInitialData(userWilayahId);
    });

    return () => { isMounted = false; };
  }, [navigate]);

  const loadInitialData = async (wilayah: string) => {
    try {
      setLoading(true);
      const [anakData, statsData, recapsData] = await Promise.all([
        cadreApi.getAnak(wilayah),
        cadreApi.getStats(wilayah),
        cadreApi.getRecaps(wilayah),
      ]);

      setAnakList(anakData);
      setStats(statsData);
      setRecaps(recapsData);
    } catch (error) {
      console.error("Error loading cadre dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdated = async () => {
    if (!wilayahId) return;

    setIsRefreshing(true);
    try {
      const [updatedAnakList, updatedStats, updatedRecaps] = await Promise.all([
        cadreApi.getAnak(wilayahId),
        cadreApi.getStats(wilayahId),
        cadreApi.getRecaps(wilayahId),
      ]);

      setAnakList(updatedAnakList);
      setStats(updatedStats);
      setRecaps(updatedRecaps);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading || !stats || !wilayahId) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>Memuat data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <section className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>Selamat Datang di Dashboard Kader Posyandu</h1>
          <p className={styles.welcomeText}>
            Kelola data kesehatan bayi di wilayah Anda. Pantau perkembangan, catat pemeriksaan, dan koordinasikan dengan
            puskesmas untuk pencegahan stunting yang efektif.
          </p>
          <p className={styles.welcomeText} style={{ marginTop: "0.75rem" }}>
            <Link to="/m/cadre/dashboard" style={{ color: "var(--color-accent-9)", fontWeight: 600 }}>
              Buka tampilan mobile untuk kader
            </Link>
          </p>
        </section>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <Users className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Anak</span>
              <span className={styles.statValue}>{stats.total_anak}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <Calendar className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Pemeriksaan Bulan Ini</span>
              <span className={styles.statValue}>{stats.total_pemeriksaan_bulan_ini}</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${stats.anak_perlu_perhatian > 0 ? styles.statCardAlert : ''}`}>
            <div className={styles.statIconWrapper}>
              <AlertCircle className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Perlu Perhatian</span>
              <span className={styles.statValue}>{stats.anak_perlu_perhatian}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <TrendingUp className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Pertumbuhan Normal</span>
              <span className={styles.statValue}>{stats.persentase_normal}%</span>
            </div>
          </div>
        </section>

        <CadreAnakList anakList={anakList} onDataUpdated={handleDataUpdated} />

        <CadreMonthlyRecap recaps={recaps} />
      </div>
    </DashboardLayout>
  );
}
