import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { Route } from "./+types/m.parent.status";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "./m.parent.status.module.css";

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
  getGrowthTrend: (anakId: string, count = 12) =>
    parentApi.fetchWithError(`/api/parent/dashboard?action=growth-trend&anakId=${anakId}&count=${count}`),
};

type GrowthTrendPoint = {
  tanggal: string;
  beratBadan: number;
  tinggiBadan: number;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Status Pertumbuhan - Anting" },
    { name: "description", content: "Grafik status pertumbuhan anak di Anting" },
  ];
}

export default function MobileParentStatusPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [anakSummaries, setAnakSummaries] = useState<any[]>([]);
  const [selectedAnakIdx, setSelectedAnakIdx] = useState(0);
  const [growthTrendByAnak, setGrowthTrendByAnak] = useState<Record<string, GrowthTrendPoint[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [growthTrendLoading, setGrowthTrendLoading] = useState(false);

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
        setLoadError("Gagal memuat data status. Coba lagi.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const currentAnak = anakSummaries.length > 0 ? anakSummaries[selectedAnakIdx] : null;

  useEffect(() => {
    const anakId = currentAnak?.anak?.id;
    if (!anakId || growthTrendByAnak[anakId]) return;

    const loadGrowthTrend = async () => {
      try {
        setGrowthTrendLoading(true);
        const trend = await parentApi.getGrowthTrend(anakId, 12);
        setGrowthTrendByAnak((prev) => ({ ...prev, [anakId]: trend ?? [] }));
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal memuat grafik pertumbuhan", variant: "destructive" });
      } finally {
        setGrowthTrendLoading(false);
      }
    };

    loadGrowthTrend();
  }, [currentAnak, growthTrendByAnak]);

  const growthChartData = useMemo(() => {
    if (!currentAnak) return [];
    const trend = growthTrendByAnak[currentAnak.anak.id] ?? [];
    return trend.map((point) => ({
      label: new Date(point.tanggal).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      "Berat Badan (kg)": point.beratBadan,
      "Tinggi Badan (cm)": point.tinggiBadan,
    }));
  }, [currentAnak, growthTrendByAnak]);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Status Pertumbuhan</h1>
        <p className={styles.subtitle}>Grafik BB/TB per anak berdasarkan hasil pemeriksaan.</p>
      </header>

      <main className={styles.main}>
        {loadError ? (
          <section className={styles.errorCard}>
            <p>{loadError}</p>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>
              Coba Lagi
            </button>
          </section>
        ) : anakSummaries.length === 0 ? (
          <section className={styles.emptyCard}>
            <p>Belum ada data anak untuk ditampilkan.</p>
          </section>
        ) : (
          <>
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

            {currentAnak && (
              <section className={styles.chartCard}>
                <h2 className={styles.cardTitle}>Grafik Pemeriksaan {currentAnak.anak.nama}</h2>
                {growthTrendLoading && growthChartData.length === 0 ? (
                  <p className={styles.chartMeta}>Memuat grafik...</p>
                ) : growthChartData.length === 0 ? (
                  <p className={styles.chartMeta}>Belum ada riwayat cukup untuk menampilkan grafik.</p>
                ) : (
                  <>
                    <div className={styles.chartWrap}>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={growthChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                          <Line
                            type="monotone"
                            dataKey="Berat Badan (kg)"
                            stroke="#00b0f0"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Tinggi Badan (cm)"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className={styles.chartMeta}>Menampilkan {growthChartData.length} pemeriksaan terakhir.</p>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <MobileParentNav />
    </div>
  );
}
