import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "../mobile-informasi.module.css";

type FilterType = "all" | "kegiatan" | "penyuluhan" | "gizi" | "pengumuman";

const parentApi = {
  fetchWithError: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
  getInformasi: () => parentApi.fetchWithError("/api/parent/dashboard?action=informasi"),
};

function formatTanggal(tanggal?: string | null) {
  if (!tanggal) return "-";
  return new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function badgeClass(kategori: string) {
  const value = (kategori || "").toLowerCase();
  if (value === "kegiatan") return styles.badgeKegiatan;
  if (value === "penyuluhan") return styles.badgePenyuluhan;
  if (value === "gizi") return styles.badgeGizi;
  return styles.badgePengumuman;
}

export default function MobileParentInformasiPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted) return;
        if (!user || user.role !== "orang_tua") {
          navigate("/login", { replace: true });
          return;
        }
        const data = await parentApi.getInformasi();
        if (!mounted) return;
        setList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal memuat informasi.", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const filtered = useMemo(() => {
    if (filter === "all") return list;
    return list.filter((item) => String(item.kategori || "").toLowerCase() === filter);
  }, [list, filter]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Informasi</h1>
        <p className={styles.subtitle}>Kegiatan, penyuluhan, dan informasi gizi terkini.</p>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.filterRow}>
            {(["all", "kegiatan", "penyuluhan", "gizi", "pengumuman"] as FilterType[]).map((f) => (
              <button key={f} type="button" className={filter === f ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter(f)}>
                {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Feed Informasi</h2>
          {loading ? (
            <p className={styles.empty}>Memuat informasi...</p>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>Belum ada informasi untuk ditampilkan.</p>
          ) : (
            <div className={styles.itemList}>
              {filtered.map((item) => (
                <article key={item.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <div>
                      <p className={styles.itemTitle}>{item.judul}</p>
                      <p className={styles.itemMeta}>
                        Oleh {item.created_by_user?.name || item.created_by_role} • {formatTanggal(item.created_at)}
                        {item.tanggal_kegiatan ? ` • Kegiatan: ${formatTanggal(item.tanggal_kegiatan)}` : ""}
                        {item.lokasi ? ` • ${item.lokasi}` : ""}
                      </p>
                    </div>
                    <span className={badgeClass(item.kategori)}>{item.kategori}</span>
                  </div>
                  {item.gambar_data_url ? (
                    <img src={item.gambar_data_url} alt={`Gambar ${item.judul}`} className={styles.itemImage} />
                  ) : null}
                  <p className={styles.itemContent}>{item.konten}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <MobileParentNav />
    </div>
  );
}
