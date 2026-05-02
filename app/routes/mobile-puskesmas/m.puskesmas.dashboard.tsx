import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/m.puskesmas.dashboard";
import { getCurrentUser, logout } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobilePuskesmasNav } from "~/components/mobile-puskesmas-nav";
import styles from "./m.puskesmas.dashboard.module.css";

type PuskesmasStats = {
  totalBalita: number;
  totalKader: number;
  totalWilayah: number;
  stuntingCount: number;
  underweightCount: number;
  wastedCount: number;
  normalCount: number;
  prevalensiStunting: number;
  cakupanPemeriksaan: number;
};

type WilayahStats = {
  wilayah_id: string;
  nama_wilayah: string;
  totalBalita: number;
  stuntingCount: number;
  prevalensi: number;
};

type KaderItem = {
  id: string;
  name: string;
  email: string;
  wilayah?: { nama_wilayah: string } | null;
};

type AnakItem = {
  id: string;
  nama: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  parent_name: string | null;
  wilayah_name: string | null;
  latest_pengukuran: string | null;
  latest_berat_badan: number | null;
  latest_tinggi_badan: number | null;
  latest_zscore_tbu: number | null;
  latest_zscore_bbu: number | null;
  latest_zscore_bbtb: number | null;
  total_pertumbuhan: number;
  total_imunisasi: number;
};

const puskesmasApi = {
  fetchWithError: async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getStats: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=stats"),
  getWilayahStats: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=wilayah-stats"),
  getKaders: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=kaders"),
  getAnak: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=anak"),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Beranda Puskesmas - Anting" },
    { name: "description", content: "Dashboard mobile untuk puskesmas di Anting" },
  ];
}

export default function MobilePuskesmasDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Puskesmas");
  const [stats, setStats] = useState<PuskesmasStats | null>(null);
  const [wilayahStats, setWilayahStats] = useState<WilayahStats[]>([]);
  const [kaders, setKaders] = useState<KaderItem[]>([]);
  const [anakList, setAnakList] = useState<AnakItem[]>([]);
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const topWilayah = useMemo(() => {
    return [...wilayahStats].sort((a, b) => b.prevalensi - a.prevalensi).slice(0, 5);
  }, [wilayahStats]);

  const anakButuhPerhatian = useMemo(() => {
    const now = Date.now();
    return anakList
      .map((anak) => {
        const daysSince = anak.latest_pengukuran
          ? Math.floor((now - new Date(anak.latest_pengukuran).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const score =
          ((anak.latest_zscore_tbu ?? 0) < -2 ? 3 : 0) +
          ((anak.latest_zscore_bbu ?? 0) < -2 ? 2 : 0) +
          ((anak.latest_zscore_bbtb ?? 0) < -2 ? 2 : 0) +
          (anak.total_pertumbuhan === 0 ? 3 : 0) +
          (daysSince > 90 ? 3 : daysSince > 60 ? 2 : daysSince > 30 ? 1 : 0) +
          (anak.total_imunisasi === 0 ? 1 : 0);
        const status = score >= 5 ? "tinggi" : score >= 3 ? "sedang" : "rendah";
        return { ...anak, daysSince, score, status };
      })
      .filter((anak) => anak.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [anakList]);

  const performaKaderWilayah = useMemo(() => {
    const kaderCountByWilayah = new Map<string, number>();
    for (const kader of kaders) {
      const wilayahName = kader.wilayah?.nama_wilayah || "Tidak diketahui";
      kaderCountByWilayah.set(wilayahName, (kaderCountByWilayah.get(wilayahName) || 0) + 1);
    }
    return wilayahStats
      .map((w) => {
        const kaderCount = kaderCountByWilayah.get(w.nama_wilayah) || 0;
        const rasioBalitaPerKader = kaderCount > 0 ? Math.round(w.totalBalita / kaderCount) : w.totalBalita;
        const status = kaderCount === 0 || rasioBalitaPerKader > 40 ? "perlu-perhatian" : "aktif";
        return { ...w, kaderCount, rasioBalitaPerKader, status };
      })
      .sort((a, b) => b.totalBalita - a.totalBalita)
      .slice(0, 6);
  }, [kaders, wilayahStats]);

  const laporanBulananPreview = useMemo(() => {
    const [year, month] = reportMonth.split("-").map((v) => Number(v));
    const monthLabel = new Date(year || 0, (month || 1) - 1, 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
    return {
      monthLabel,
      totalBalita: stats?.totalBalita ?? 0,
      totalKader: stats?.totalKader ?? 0,
      prevalensiStunting: Number((stats?.prevalensiStunting ?? 0).toFixed(1)),
      cakupanPemeriksaan: Number((stats?.cakupanPemeriksaan ?? 0).toFixed(1)),
      wilayahPrioritas: topWilayah[0]?.nama_wilayah || "-",
      anakPerluAtensi: anakButuhPerhatian.length,
    };
  }, [reportMonth, stats, topWilayah, anakButuhPerhatian]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [statsData, wilayahData, kadersData, anakData] = await Promise.all([
        puskesmasApi.getStats(),
        puskesmasApi.getWilayahStats(),
        puskesmasApi.getKaders(),
        puskesmasApi.getAnak(),
      ]);
      setStats(statsData);
      setWilayahStats(Array.isArray(wilayahData) ? wilayahData : []);
      setKaders(Array.isArray(kadersData) ? kadersData : []);
      setAnakList(Array.isArray(anakData) ? anakData : []);
    } catch (error) {
      console.error(error);
      setLoadError("Gagal memuat data puskesmas. Coba lagi.");
      toast({ title: "Error", description: "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((user) => {
      if (!mounted) return;
      if (!user || user.role !== "puskesmas") {
        navigate("/login", { replace: true });
        return;
      }
      if (user.name) setUserName(user.name);
      loadData();
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleDownloadReport = () => {
    const monthParam = encodeURIComponent(reportMonth || new Date().toISOString().slice(0, 7));
    window.location.href = `/api/puskesmas/dashboard?action=export-csv&month=${monthParam}`;
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
          <section className={styles.errorCard}>
            <p>{loadError}</p>
            <button type="button" className={styles.primaryBtn} onClick={loadData}>
              Coba Lagi
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerAvatar}>
          <span className={styles.iconFilled}>local_hospital</span>
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerName}>Halo, {userName}</h1>
          <p className={styles.headerSub}>Ringkasan layanan wilayah puskesmas</p>
        </div>
        <button type="button" className={styles.headerBtn} onClick={handleLogout} aria-label="Logout">
          <span className={styles.icon}>logout</span>
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Total Balita</p>
            <p className={styles.statValue}>{stats?.totalBalita ?? 0}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Total Kader</p>
            <p className={styles.statValue}>{stats?.totalKader ?? 0}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Prevalensi Stunting</p>
            <p className={styles.statValue}>{(stats?.prevalensiStunting ?? 0).toFixed(1)}%</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Cakupan Pemeriksaan</p>
            <p className={styles.statValue}>{(stats?.cakupanPemeriksaan ?? 0).toFixed(1)}%</p>
          </article>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Anak Butuh Perhatian</h2>
            <Link to="/m/puskesmas/anak" className={styles.linkBtn}>
              Lihat Semua
            </Link>
          </div>
          {anakButuhPerhatian.length === 0 ? (
            <p className={styles.emptyText}>Belum ada anak prioritas dari data saat ini.</p>
          ) : (
            <div className={styles.list}>
              {anakButuhPerhatian.map((anak) => (
                <div key={anak.id} className={styles.listItem}>
                  <div>
                    <p className={styles.itemTitle}>{anak.nama}</p>
                    <p className={styles.itemSub}>
                      {anak.wilayah_name || "Wilayah tidak tersedia"} • {anak.daysSince > 900 ? "Belum pernah diperiksa" : `${anak.daysSince} hari lalu`}
                    </p>
                  </div>
                  <span className={anak.status === "tinggi" ? styles.badgeDanger : styles.badgeWarning}>
                    {anak.status === "tinggi" ? "Prioritas Tinggi" : "Perlu Tindak Lanjut"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Wilayah Prioritas</h2>
            <button type="button" className={styles.linkBtn} onClick={loadData}>
              Refresh
            </button>
          </div>
          {topWilayah.length === 0 ? (
            <p className={styles.emptyText}>Belum ada data wilayah.</p>
          ) : (
            <div className={styles.list}>
              {topWilayah.map((w) => (
                <div key={w.wilayah_id} className={styles.listItem}>
                  <div>
                    <p className={styles.itemTitle}>{w.nama_wilayah}</p>
                    <p className={styles.itemSub}>
                      {w.totalBalita} balita • {w.stuntingCount} stunting
                    </p>
                  </div>
                  <span className={styles.badge}>{w.prevalensi.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Performa Kader per Wilayah</h2>
          {performaKaderWilayah.length === 0 ? (
            <p className={styles.emptyText}>Belum ada data wilayah/kader.</p>
          ) : (
            <div className={styles.list}>
              {performaKaderWilayah.map((item) => (
                <div key={item.wilayah_id} className={styles.listItem}>
                  <div>
                    <p className={styles.itemTitle}>{item.nama_wilayah}</p>
                    <p className={styles.itemSub}>
                      {item.kaderCount} kader • Rasio {item.rasioBalitaPerKader} balita/kader
                    </p>
                  </div>
                  <span className={item.status === "aktif" ? styles.badgeSuccess : styles.badgeWarning}>
                    {item.status === "aktif" ? "Aktif" : "Perlu Perhatian"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Laporan Bulanan Satu Klik</h2>
          <div className={styles.reportControls}>
            <label className={styles.reportLabel}>Periode laporan</label>
            <input
              type="month"
              className={styles.reportInput}
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleDownloadReport}
            >
              Unduh Rekap (CSV)
            </button>
          </div>
          <div className={styles.reportSummary}>
            <p className={styles.itemMetaStrong}>Periode: {laporanBulananPreview.monthLabel}</p>
            <p className={styles.itemMeta}>Total balita: {laporanBulananPreview.totalBalita}</p>
            <p className={styles.itemMeta}>Total kader: {laporanBulananPreview.totalKader}</p>
            <p className={styles.itemMeta}>Prevalensi stunting: {laporanBulananPreview.prevalensiStunting}%</p>
            <p className={styles.itemMeta}>Cakupan pemeriksaan: {laporanBulananPreview.cakupanPemeriksaan}%</p>
            <p className={styles.itemMeta}>Wilayah prioritas utama: {laporanBulananPreview.wilayahPrioritas}</p>
            <p className={styles.itemMeta}>Anak perlu atensi: {laporanBulananPreview.anakPerluAtensi}</p>
          </div>
        </section>

        <Link to="/puskesmas/dashboard" className={styles.desktopLink}>
          Buka Dashboard Lengkap
        </Link>
      </main>
      <MobilePuskesmasNav />
    </div>
  );
}
