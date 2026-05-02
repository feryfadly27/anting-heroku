import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/m.puskesmas.anak";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobilePuskesmasNav } from "~/components/mobile-puskesmas-nav";
import styles from "./m.puskesmas.anak.module.css";

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
    { title: "Data Anak - Puskesmas Anting" },
    { name: "description", content: "Daftar seluruh data anak pada puskesmas" },
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

export default function MobilePuskesmasAnakPage() {
  const navigate = useNavigate();
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
      toast({ title: "Error", description: "Gagal memuat data anak", variant: "destructive" });
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
      loadData();
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Data Anak</h1>
        <button className={styles.refreshBtn} type="button" onClick={loadData}>
          Refresh
        </button>
      </header>

      <main className={styles.main}>
        <input
          className={styles.searchInput}
          placeholder="Cari nama anak, orang tua, atau wilayah..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
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

        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
          </div>
        ) : loadError ? (
          <section className={styles.errorCard}>
            <p>{loadError}</p>
          </section>
        ) : filteredAnak.length === 0 ? (
          <section className={styles.emptyCard}>
            <p>Data anak belum tersedia.</p>
          </section>
        ) : (
          <section className={styles.list}>
            {filteredAnak.map((anak) => (
              <article key={anak.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <h2 className={styles.itemTitle}>{anak.nama}</h2>
                  <div className={styles.itemBadges}>
                    <span className={styles.badge}>{calculateAge(anak.tanggal_lahir)}</span>
                    {anak.priority === "tinggi" ? (
                      <span className={styles.badgeDanger}>Prioritas Tinggi</span>
                    ) : anak.priority === "perlu" ? (
                      <span className={styles.badgeWarning}>Perlu Tindak Lanjut</span>
                    ) : (
                      <span className={styles.badgeSuccess}>Stabil</span>
                    )}
                  </div>
                </div>
                <p className={styles.itemSub}>
                  {anak.jenis_kelamin === "laki_laki" ? "Laki-laki" : "Perempuan"} • {anak.parent_name || "Orang tua tidak tersedia"}
                </p>
                <p className={styles.itemMeta}>Wilayah: {anak.wilayah_name || "-"}</p>
                <p className={styles.itemMeta}>
                  Pemeriksaan: {anak.total_pertumbuhan} • Imunisasi: {anak.total_imunisasi}
                </p>
                <p className={styles.itemMeta}>
                  Status z-score: TB/U {anak.latest_zscore_tbu ?? "-"} • BB/U {anak.latest_zscore_bbu ?? "-"} • BB/TB{" "}
                  {anak.latest_zscore_bbtb ?? "-"}
                </p>
                <p className={styles.itemMeta}>
                  Terakhir:{" "}
                  {anak.latest_pengukuran
                    ? new Date(anak.latest_pengukuran).toLocaleDateString("id-ID")
                    : "Belum ada"}{" "}
                  {anak.latest_berat_badan !== null && anak.latest_tinggi_badan !== null
                    ? `(${anak.latest_berat_badan}kg / ${anak.latest_tinggi_badan}cm)`
                    : ""}
                </p>
              </article>
            ))}
          </section>
        )}
      </main>

      <MobilePuskesmasNav />
    </div>
  );
}
