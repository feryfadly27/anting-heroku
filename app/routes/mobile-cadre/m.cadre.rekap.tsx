import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/m.cadre.rekap";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileCadreNav } from "~/components/mobile-cadre-nav";
import styles from "./m.cadre.rekap.module.css";

const cadreApi = {
  fetchWithError: async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getRecaps: (wilayahId: string) =>
    cadreApi.fetchWithError(`/api/cadre/dashboard?action=recaps&wilayahId=${encodeURIComponent(wilayahId)}`),
};

type Recap = {
  month: string;
  year: number;
  total_anak: number;
  total_pemeriksaan: number;
  normal_count: number;
  stunted_count: number;
  severely_stunted_count: number;
  underweight_count: number;
  wasted_count: number;
};

export function meta({}: Route.MetaArgs) {
  return [{ title: "Rekap Bulanan - Kader" }, { name: "description", content: "Rekap data bulanan wilayah" }];
}

export default function MobileCadreRekapPage() {
  const navigate = useNavigate();
  const [wilayahId, setWilayahId] = useState<string | null>(null);
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let m = true;
    getCurrentUser().then((user) => {
      if (!m) return;
      if (!user || user.role !== "kader") {
        navigate("/login", { replace: true });
        return;
      }
      setWilayahId(user.wilayah_id || "wilayah_001");
    });
    return () => {
      m = false;
    };
  }, [navigate]);

  const load = async (wid: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await cadreApi.getRecaps(wid);
      setRecaps(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setLoadError("Gagal memuat rekap.");
      toast({ title: "Error", description: "Gagal memuat rekap", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wilayahId) load(wilayahId);
  }, [wilayahId]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Rekap bulanan</h1>
        <p className={styles.subtitle}>Enam bulan terakhir per wilayah binaan</p>
      </header>

      <main className={styles.main}>
        {loading && recaps.length === 0 ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
          </div>
        ) : loadError && recaps.length === 0 ? (
          <div className={styles.errorCard}>
            <p>{loadError}</p>
            <button type="button" className={styles.retryBtn} onClick={() => wilayahId && load(wilayahId)}>
              Coba Lagi
            </button>
          </div>
        ) : recaps.length === 0 ? (
          <p className={styles.empty}>Belum ada data rekap.</p>
        ) : (
          <div className={styles.list}>
            {recaps.map((r, idx) => (
              <article key={`${r.year}-${r.month}-${idx}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <p className={styles.period}>
                    {r.month} {r.year}
                  </p>
                  {idx === 0 ? <span className={styles.badge}>Terbaru</span> : null}
                </div>
                <div className={styles.grid}>
                  <span className={styles.label}>Total anak</span>
                  <span className={styles.val}>{r.total_anak}</span>
                  <span className={styles.label}>Pemeriksaan</span>
                  <span className={styles.val}>{r.total_pemeriksaan}</span>
                  <span className={styles.label}>Normal</span>
                  <span className={styles.valOk}>{r.normal_count}</span>
                  <span className={styles.label}>Stunting (total)</span>
                  <span className={styles.valWarn}>{r.stunted_count + r.severely_stunted_count}</span>
                </div>
                <div className={styles.detail}>
                  Stunting ringan: {r.stunted_count} · Berat: {r.severely_stunted_count} · BB kurang: {r.underweight_count}{" "}
                  · Gizi buruk: {r.wasted_count}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <MobileCadreNav />
    </div>
  );
}
