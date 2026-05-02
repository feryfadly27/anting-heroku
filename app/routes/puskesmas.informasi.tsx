import { useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/puskesmas.informasi";
import { DashboardLayout } from "~/components/dashboard-layout";
import { getCurrentUser } from "~/utils/auth";
import { Button } from "~/components/ui/button/button";
import styles from "./puskesmas.informasi.module.css";

type FilterType = "all" | "kegiatan" | "penyuluhan" | "gizi" | "pengumuman";

const api = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  get: () => api.fetchWithError("/api/puskesmas/dashboard?action=informasi"),
  submit: (fd: FormData) => api.fetchWithError("/api/puskesmas/dashboard", { method: "POST", body: fd }),
};

export function meta({}: Route.MetaArgs) { return [{ title: "Informasi - Desktop Puskesmas" }]; }

export default function PuskesmasInformasiPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState<FilterType>("kegiatan");
  const [konten, setKonten] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.get();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!judul.trim() || !konten.trim() || kategori === "all") return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("intent", "create-informasi");
      fd.append("data", JSON.stringify({ judul: judul.trim(), kategori, konten: konten.trim(), is_pinned: false }));
      await api.submit(fd);
      setJudul(""); setKonten(""); setKategori("kegiatan");
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((u) => { if (mounted && u?.role === "puskesmas") loadData(); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => filter === "all" ? list : list.filter((i) => String(i.kategori || "").toLowerCase() === filter), [list, filter]);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <section className={styles.formCard}>
          <h1 className={styles.title}>Informasi</h1>
          <input className={styles.input} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul" />
          <select className={styles.input} value={kategori} onChange={(e) => setKategori(e.target.value as FilterType)}>
            <option value="kegiatan">Kegiatan</option><option value="penyuluhan">Penyuluhan</option><option value="gizi">Gizi</option><option value="pengumuman">Pengumuman</option>
          </select>
          <textarea className={styles.textarea} value={konten} onChange={(e) => setKonten(e.target.value)} placeholder="Konten informasi..." />
          <Button onClick={submit} disabled={saving}>{saving ? "Menyimpan..." : "Publikasikan"}</Button>
        </section>

        <section className={styles.feedCard}>
          <div className={styles.filterRow}>
            {(["all", "kegiatan", "penyuluhan", "gizi", "pengumuman"] as FilterType[]).map((f) => (
              <button key={f} type="button" className={filter === f ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter(f)}>
                {f === "all" ? "Semua" : f}
              </button>
            ))}
          </div>
          {loading ? <p className={styles.emptyText}>Memuat informasi...</p> : null}
          {!loading && filtered.length === 0 ? <p className={styles.emptyText}>Belum ada informasi.</p> : null}
          {!loading && filtered.length > 0 ? (
            <div className={styles.list}>
              {filtered.map((item) => (
                <article key={item.id} className={styles.item}>
                  <p className={styles.itemTitle}>{item.judul}</p>
                  <p className={styles.itemMeta}>{item.kategori} • {item.created_by_user?.name || item.created_by_role}</p>
                  <p className={styles.itemContent}>{item.konten}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
}
