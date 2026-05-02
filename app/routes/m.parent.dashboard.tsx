import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/m.parent.dashboard";
import { getCurrentUser, logout } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { toIndonesianNutritionAlert, toIndonesianNutritionStatus } from "~/utils/nutrition-status";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "./m.parent.dashboard.module.css";

const parentApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getStats: () => parentApi.fetchWithError("/api/parent/dashboard?action=stats"),
  getSummaries: () => parentApi.fetchWithError("/api/parent/dashboard?action=summaries"),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard Mobile - Anting" },
    { name: "description", content: "Dashboard mobile untuk orang tua di Anting" },
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

function getZScoreColor(zscore: number | null): "green" | "warning" | "danger" {
  if (zscore === null) return "green";
  if (zscore < -3) return "danger";
  if (zscore < -2) return "warning";
  return "green";
}

function getZScorePercent(zscore: number | null): number {
  if (zscore === null) return 50;
  const clamped = Math.max(-5, Math.min(5, zscore));
  return Math.round(((clamped + 5) / 10) * 100);
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
    )
      return "danger";
    return "warning";
  }
  return "normal";
}

export default function MobileParentDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Bunda");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [anakSummaries, setAnakSummaries] = useState<any[]>([]);
  const [selectedAnakIdx, setSelectedAnakIdx] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getCurrentUser().then((user) => {
      if (!isMounted) return;
      if (!user || user.role !== "orang_tua") {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(user.id);
      if (user.name) setUserName(user.name);
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [statsData, summaries] = await Promise.all([parentApi.getStats(), parentApi.getSummaries()]);
      setStats(statsData);
      setAnakSummaries(summaries);
    } catch (error) {
      console.error(error);
      setLoadError("Gagal memuat data. Cek koneksi lalu coba lagi.");
      toast({ title: "Error", description: "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <section className={styles.errorCard}>
            <h2>Data belum tersedia</h2>
            <p>{loadError}</p>
            <button className={styles.primaryBtn} onClick={loadData}>
              Coba Lagi
            </button>
          </section>
        </main>
      </div>
    );
  }

  const currentAnak = anakSummaries.length > 0 ? anakSummaries[selectedAnakIdx] : null;
  const isMale = (jenisKelamin: string | null | undefined) => jenisKelamin === "laki_laki" || jenisKelamin === "L";

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerAvatar}>
          <span className={styles.icon} style={{ fontSize: "1.75rem" }}>
            face_6
          </span>
        </div>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerName}>Halo Bunda {userName}</h2>
          <p className={styles.headerSubtext}>Semoga harimu menyenangkan.</p>
        </div>
        <button className={styles.headerNotif} onClick={handleLogout} aria-label="Logout">
          <span className={styles.icon}>logout</span>
        </button>
      </header>

      <main className={styles.main}>
        {/* Stats Overview */}
        {stats && (
          <section className={styles.statsSection}>
            <p className={styles.lastUpdated}>
              Update terakhir: {stats.lastUpdateDate ? new Date(stats.lastUpdateDate).toLocaleDateString("id-ID") : "Belum ada"}
            </p>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconWrap} data-color="blue">
                  <span className={styles.icon}>child_care</span>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Total Anak</span>
                  <span className={styles.statValue}>{stats.totalAnak}</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrap} data-color={stats.anakNeedAttention > 0 ? "red" : "green"}>
                  <span className={styles.icon}>{stats.anakNeedAttention > 0 ? "warning" : "check_circle"}</span>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Perlu Perhatian</span>
                  <span className={styles.statValue}>{stats.anakNeedAttention}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Child Selector Tabs (if multiple children) */}
        {anakSummaries.length > 1 && (
          <div className={styles.tabBar}>
            {anakSummaries.map((s: any, idx: number) => (
              <button
                key={s.anak.id}
                className={idx === selectedAnakIdx ? styles.tabActive : styles.tab}
                onClick={() => setSelectedAnakIdx(idx)}
              >
                {s.anak.nama}
              </button>
            ))}
          </div>
        )}

        {/* Selected Child Growth Card */}
        {currentAnak ? (
          <section id="growth-section" className={styles.growthSection}>
            <h2 className={styles.sectionTitle}>Status Pertumbuhan {currentAnak.anak.nama}</h2>

            <div className={styles.growthCard}>
              {/* Child info header */}
              <div className={styles.childHeader}>
                <div className={styles.childIcon} data-status={getStatusType(currentAnak)}>
                  <span className={styles.icon} style={{ fontSize: "2rem" }}>
                    {isMale(currentAnak.anak.jenis_kelamin) ? "face" : "face_3"}
                  </span>
                </div>
                <div className={styles.childMeta}>
                  <h3 className={styles.childName}>{currentAnak.anak.nama}</h3>
                  <p className={styles.childAge}>
                    {isMale(currentAnak.anak.jenis_kelamin) ? "Laki-laki" : "Perempuan"} •{" "}
                    {calculateAge(currentAnak.anak.tanggal_lahir)}
                  </p>
                </div>
                <div className={styles.statusBadge} data-status={getStatusType(currentAnak)}>
                  {getStatusLabel(currentAnak)}
                </div>
              </div>

              {currentAnak.latestPertumbuhan ? (
                <>
                  {/* Latest measurement date */}
                  <p className={styles.updateLabel}>
                    Pengukuran terakhir:{" "}
                    {new Date(currentAnak.latestPertumbuhan.tanggal_pengukuran).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {/* Weight & Height */}
                  <div className={styles.measureGrid}>
                    <div className={styles.measureItem}>
                      <span className={`${styles.icon} ${styles.textPrimary}`} style={{ fontSize: "1.25rem" }}>
                        weight
                      </span>
                      <div>
                        <p className={styles.measureVal}>{currentAnak.latestPertumbuhan.berat_badan} kg</p>
                        <p className={styles.measureLabel}>Berat Badan</p>
                      </div>
                    </div>
                    <div className={styles.measureItem}>
                      <span className={`${styles.icon} ${styles.textPrimary}`} style={{ fontSize: "1.25rem" }}>
                        straighten
                      </span>
                      <div>
                        <p className={styles.measureVal}>{currentAnak.latestPertumbuhan.tinggi_badan} cm</p>
                        <p className={styles.measureLabel}>Tinggi Badan</p>
                      </div>
                    </div>
                  </div>

                  {/* Z-Score Bars */}
                  <div className={styles.zscoreList}>
                    {currentAnak.latestPertumbuhan.zscore_tbu !== null && (
                      <div className={styles.zscoreRow}>
                        <div className={styles.zscoreLabel}>
                          <span>
                            TB/U{" "}
                            <span className={styles.zscoreCategory}>
                              ({toIndonesianNutritionStatus(currentAnak.latestPertumbuhan.kategori_tbu)})
                            </span>
                          </span>
                          <span
                            className={styles[`zscore_${getZScoreColor(currentAnak.latestPertumbuhan.zscore_tbu)}`]}
                          >
                            {currentAnak.latestPertumbuhan.zscore_tbu > 0 ? "+" : ""}
                            {Number(currentAnak.latestPertumbuhan.zscore_tbu).toFixed(2)} SD
                          </span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div
                            className={
                              styles[`progressBar_${getZScoreColor(currentAnak.latestPertumbuhan.zscore_tbu)}`]
                            }
                            style={{ width: `${getZScorePercent(currentAnak.latestPertumbuhan.zscore_tbu)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {currentAnak.latestPertumbuhan.zscore_bbu !== null && (
                      <div className={styles.zscoreRow}>
                        <div className={styles.zscoreLabel}>
                          <span>
                            BB/U{" "}
                            <span className={styles.zscoreCategory}>
                              ({toIndonesianNutritionStatus(currentAnak.latestPertumbuhan.kategori_bbu)})
                            </span>
                          </span>
                          <span
                            className={styles[`zscore_${getZScoreColor(currentAnak.latestPertumbuhan.zscore_bbu)}`]}
                          >
                            {currentAnak.latestPertumbuhan.zscore_bbu > 0 ? "+" : ""}
                            {Number(currentAnak.latestPertumbuhan.zscore_bbu).toFixed(2)} SD
                          </span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div
                            className={
                              styles[`progressBar_${getZScoreColor(currentAnak.latestPertumbuhan.zscore_bbu)}`]
                            }
                            style={{ width: `${getZScorePercent(currentAnak.latestPertumbuhan.zscore_bbu)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {currentAnak.latestPertumbuhan.zscore_bbtb !== null && (
                      <div className={styles.zscoreRow}>
                        <div className={styles.zscoreLabel}>
                          <span>
                            BB/TB{" "}
                            <span className={styles.zscoreCategory}>
                              ({toIndonesianNutritionStatus(currentAnak.latestPertumbuhan.kategori_bbtb)})
                            </span>
                          </span>
                          <span
                            className={styles[`zscore_${getZScoreColor(currentAnak.latestPertumbuhan.zscore_bbtb)}`]}
                          >
                            {currentAnak.latestPertumbuhan.zscore_bbtb > 0 ? "+" : ""}
                            {Number(currentAnak.latestPertumbuhan.zscore_bbtb).toFixed(2)} SD
                          </span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div
                            className={
                              styles[`progressBar_${getZScoreColor(currentAnak.latestPertumbuhan.zscore_bbtb)}`]
                            }
                            style={{ width: `${getZScorePercent(currentAnak.latestPertumbuhan.zscore_bbtb)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alerts */}
                  {currentAnak.alerts && currentAnak.alerts.length > 0 && (
                    <div className={styles.alertsBox}>
                      <div className={styles.alertsHeader}>
                        <span className={styles.icon} style={{ fontSize: "1rem", color: "#dc3545" }}>
                          warning
                        </span>
                        <span>Peringatan</span>
                      </div>
                      {currentAnak.alerts.map((alert: string, idx: number) => (
                        <p key={idx} className={styles.alertItem}>
                          {toIndonesianNutritionAlert(alert)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Record count */}
                  <p className={styles.recordCount}>{currentAnak.pertumbuhanCount} catatan pertumbuhan</p>
                </>
              ) : (
                <div className={styles.noDataBox}>
                  <span className={styles.icon} style={{ fontSize: "2.5rem", color: "#94a3b8" }}>
                    info
                  </span>
                  <p>Belum ada data pertumbuhan untuk {currentAnak.anak.nama}.</p>
                  <Link to={`/m/parent/anak/${currentAnak.anak.id}`} className={styles.primaryBtn}>
                    Lihat Profil Anak
                  </Link>
                </div>
              )}

              <Link to={`/m/parent/anak/${currentAnak.anak.id}`} className={styles.detailBtn}>
                <span>Lihat Profil Lengkap</span>
                <span className={styles.icon} style={{ fontSize: "1rem" }}>
                  arrow_forward
                </span>
              </Link>
            </div>
          </section>
        ) : (
          /* No children at all */
          <section id="growth-section" className={styles.growthSection}>
            <div className={styles.emptyCard}>
              <span className={styles.icon} style={{ fontSize: "3rem", color: "#94a3b8" }}>
                child_care
              </span>
              <h3>Belum ada data anak</h3>
              <p className={styles.emptyText}>Silakan tambahkan data anak melalui menu Tambah.</p>
              <Link to="/m/parent/anak/new" className={styles.primaryBtn}>
                Tambah Anak
              </Link>
            </div>
          </section>
        )}

        {/* All Children Quick List (if more than 1) */}
        {anakSummaries.length > 1 && (
          <section id="children-list-section" className={styles.childListSection}>
            <h3 className={styles.sectionTitleSm}>Semua Anak</h3>
            <div className={styles.childList}>
              {anakSummaries.map((s: any, idx: number) => {
                const statusType = getStatusType(s);
                return (
                  <Link
                    key={s.anak.id}
                    className={styles.childListItem}
                    data-border={statusType}
                    to={`/m/parent/anak/${s.anak.id}`}
                  >
                    <div className={styles.childListLeft}>
                      <div className={styles.childListIcon}>
                        <span className={styles.icon}>{isMale(s.anak.jenis_kelamin) ? "face" : "face_3"}</span>
                      </div>
                      <div>
                        <p className={styles.childListName}>{s.anak.nama}</p>
                        <p className={styles.childListAge}>
                          {calculateAge(s.anak.tanggal_lahir)} •{" "}
                          {s.latestPertumbuhan ? `${s.latestPertumbuhan.berat_badan} kg` : "Belum diukur"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.childListBadge} data-status={statusType}>
                      {getStatusLabel(s)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <MobileParentNav />
    </div>
  );
}
