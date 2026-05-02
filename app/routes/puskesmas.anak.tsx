import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Search, RefreshCw } from "lucide-react";
import type { Route } from "./+types/puskesmas.anak";
import { DashboardLayout } from "~/components/dashboard-layout";
import { getCurrentUser } from "~/utils/auth";
import { Button } from "~/components/ui/button/button";
import styles from "./puskesmas.anak.module.css";

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

type PriorityFilter = "semua" | "tinggi" | "perlu";

const puskesmasApi = {
  fetchWithError: async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getAnak: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=anak"),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Data Anak - Desktop Puskesmas" },
    { name: "description", content: "Halaman desktop data anak puskesmas" },
  ];
}

function calculateAge(tanggalLahir: string): string {
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  const diffMonths = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (diffMonths < 12) return `${diffMonths} bulan`;
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  return months > 0 ? `${years} thn ${months} bln` : `${years} tahun`;
}

export default function PuskesmasAnakPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [anakList, setAnakList] = useState<AnakItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("semua");

  const anakWithPriority = useMemo(() => {
    const now = Date.now();
    return anakList.map((a) => {
      const daysSince = a.latest_pengukuran
        ? Math.floor((now - new Date(a.latest_pengukuran).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const score =
        ((a.latest_zscore_tbu ?? 0) < -2 ? 3 : 0) +
        ((a.latest_zscore_bbu ?? 0) < -2 ? 2 : 0) +
        ((a.latest_zscore_bbtb ?? 0) < -2 ? 2 : 0) +
        (a.total_pertumbuhan === 0 ? 3 : 0) +
        (daysSince > 90 ? 3 : daysSince > 60 ? 2 : daysSince > 30 ? 1 : 0) +
        (a.total_imunisasi === 0 ? 1 : 0);
      const priority: PriorityFilter = score >= 5 ? "tinggi" : score >= 3 ? "perlu" : "semua";
      return { ...a, daysSince, score, priority };
    });
  }, [anakList]);

  const filteredAnak = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const byKeyword = !q
      ? anakWithPriority
      : anakWithPriority.filter((a) =>
          [a.nama, a.parent_name || "", a.wilayah_name || ""].some((val) => val.toLowerCase().includes(q))
        );
    if (priorityFilter === "semua") return byKeyword;
    return byKeyword.filter((a) => a.priority === priorityFilter);
  }, [anakWithPriority, keyword, priorityFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await puskesmasApi.getAnak();
      setAnakList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLoadError("Gagal memuat data anak.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((user) => {
      if (!mounted) return;
      if (!user || user.role !== "puskesmas") {
        return;
      }
      loadData();
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <section className={styles.headerCard}>
          <div>
            <h1 className={styles.title}>Data Anak</h1>
            <p className={styles.subtitle}>Halaman desktop untuk pemantauan data anak seluruh wilayah.</p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={styles.btnIcon} />
            Refresh
          </Button>
        </section>

        <section className={styles.filterCard}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Cari nama anak, orang tua, atau wilayah..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className={styles.filterRow}>
            <button
              type="button"
              className={priorityFilter === "semua" ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setPriorityFilter("semua")}
            >
              Semua
            </button>
            <button
              type="button"
              className={priorityFilter === "tinggi" ? styles.filterDanger : styles.filterBtn}
              onClick={() => setPriorityFilter("tinggi")}
            >
              Prioritas Tinggi
            </button>
            <button
              type="button"
              className={priorityFilter === "perlu" ? styles.filterWarning : styles.filterBtn}
              onClick={() => setPriorityFilter("perlu")}
            >
              Perlu Tindak Lanjut
            </button>
          </div>
        </section>

        <section className={styles.tableCard}>
          {loading ? <p className={styles.emptyText}>Memuat data...</p> : null}
          {!loading && loadError ? <p className={styles.emptyText}>{loadError}</p> : null}
          {!loading && !loadError && filteredAnak.length === 0 ? <p className={styles.emptyText}>Data anak belum tersedia.</p> : null}
          {!loading && !loadError && filteredAnak.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Anak</th>
                    <th>Orang Tua / Wilayah</th>
                    <th>Status</th>
                    <th>Pemeriksaan</th>
                    <th>Z-Score</th>
                    <th>Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnak.map((anak) => (
                    <tr key={anak.id}>
                      <td>
                        <p className={styles.name}>{anak.nama}</p>
                        <p className={styles.meta}>{calculateAge(anak.tanggal_lahir)}</p>
                      </td>
                      <td>
                        <p className={styles.metaStrong}>{anak.parent_name || "-"}</p>
                        <p className={styles.meta}>{anak.wilayah_name || "-"}</p>
                      </td>
                      <td>
                        <span
                          className={
                            anak.priority === "tinggi"
                              ? styles.badgeDanger
                              : anak.priority === "perlu"
                                ? styles.badgeWarning
                                : styles.badgeSuccess
                          }
                        >
                          {anak.priority === "tinggi" ? "Prioritas Tinggi" : anak.priority === "perlu" ? "Perlu Tindak Lanjut" : "Stabil"}
                        </span>
                      </td>
                      <td>{anak.total_pertumbuhan} / {anak.total_imunisasi}</td>
                      <td>
                        TB/U {anak.latest_zscore_tbu ?? "-"} | BB/U {anak.latest_zscore_bbu ?? "-"} | BB/TB {anak.latest_zscore_bbtb ?? "-"}
                      </td>
                      <td>
                        {anak.latest_pengukuran ? new Date(anak.latest_pengukuran).toLocaleDateString("id-ID") : "Belum ada"}
                      </td>
                      <td>
                        <Link className={styles.detailLink} to={`/puskesmas/anak/${anak.id}`}>
                          Lihat Profil
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
}
