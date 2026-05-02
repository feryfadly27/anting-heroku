import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/m.puskesmas.wilayah";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobilePuskesmasNav } from "~/components/mobile-puskesmas-nav";
import styles from "./m.puskesmas.wilayah.module.css";

type WilayahStats = {
  wilayah_id: string;
  nama_wilayah: string;
  tipe: WilayahType;
  totalBalita: number;
  stuntingCount: number;
  prevalensi: number;
};

type WilayahType = "desa" | "kelurahan" | "puskesmas";

const puskesmasApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getWilayahStats: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=wilayah-stats"),
  createWilayah: (formData: FormData) =>
    puskesmasApi.fetchWithError("/api/puskesmas/dashboard", {
      method: "POST",
      body: formData,
    }),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Wilayah - Puskesmas Anting" },
    { name: "description", content: "Ringkasan wilayah kerja puskesmas" },
  ];
}

export default function MobilePuskesmasWilayahPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wilayahStats, setWilayahStats] = useState<WilayahStats[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [namaWilayah, setNamaWilayah] = useState("");
  const [tipeWilayah, setTipeWilayah] = useState<WilayahType>("desa");
  const [editingWilayahId, setEditingWilayahId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => {
    return [...wilayahStats].sort((a, b) => b.prevalensi - a.prevalensi);
  }, [wilayahStats]);

  const handleCreateWilayah = async () => {
    if (!namaWilayah.trim()) {
      toast({ title: "Data belum lengkap", description: "Nama wilayah wajib diisi.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("intent", "create-wilayah");
      formData.append(
        "data",
        JSON.stringify({
          nama_wilayah: namaWilayah.trim(),
          tipe: tipeWilayah,
        })
      );
      await puskesmasApi.createWilayah(formData);
      setNamaWilayah("");
      setTipeWilayah("desa");
      setShowForm(false);
      await loadData();
      toast({ title: "Berhasil", description: "Wilayah baru berhasil ditambahkan." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal", description: "Tidak bisa menambah wilayah saat ini.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const startEditWilayah = (wilayah: WilayahStats) => {
    setEditingWilayahId(wilayah.wilayah_id);
    setNamaWilayah(wilayah.nama_wilayah);
    setTipeWilayah(wilayah.tipe);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingWilayahId(null);
    setNamaWilayah("");
    setTipeWilayah("desa");
  };

  const handleUpdateWilayah = async () => {
    if (!editingWilayahId || !namaWilayah.trim()) {
      toast({ title: "Data belum lengkap", description: "Nama wilayah wajib diisi.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("intent", "update-wilayah");
      formData.append("id", editingWilayahId);
      formData.append(
        "data",
        JSON.stringify({
          nama_wilayah: namaWilayah.trim(),
          tipe: tipeWilayah,
        })
      );
      await puskesmasApi.createWilayah(formData);
      await loadData();
      cancelForm();
      toast({ title: "Berhasil", description: "Wilayah berhasil diperbarui." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal", description: "Tidak bisa memperbarui wilayah saat ini.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await puskesmasApi.getWilayahStats();
      setWilayahStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLoadError("Gagal memuat data wilayah.");
      toast({ title: "Error", description: "Gagal memuat data wilayah", variant: "destructive" });
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
        <h1 className={styles.title}>Wilayah</h1>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Tutup Form" : "Tambah Wilayah"}
          </button>
          <button className={styles.refreshBtn} type="button" onClick={loadData}>
            Refresh
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {showForm ? (
          <section className={styles.formCard}>
            <h2 className={styles.formTitle}>{editingWilayahId ? "Edit Wilayah" : "Tambah Wilayah Baru"}</h2>
            <label className={styles.label}>Nama Wilayah</label>
            <input className={styles.input} value={namaWilayah} onChange={(e) => setNamaWilayah(e.target.value)} placeholder="Contoh: Desa Sukamaju" />
            <label className={styles.label}>Tipe</label>
            <select className={styles.input} value={tipeWilayah} onChange={(e) => setTipeWilayah(e.target.value as WilayahType)}>
              <option value="desa">Desa</option>
              <option value="kelurahan">Kelurahan</option>
              <option value="puskesmas">Puskesmas</option>
            </select>
            <div className={styles.formActions}>
              <button className={styles.submitBtn} type="button" disabled={saving} onClick={editingWilayahId ? handleUpdateWilayah : handleCreateWilayah}>
                {saving ? "Menyimpan..." : editingWilayahId ? "Simpan Perubahan" : "Simpan Wilayah"}
              </button>
              {editingWilayahId ? (
                <button className={styles.cancelBtn} type="button" disabled={saving} onClick={cancelForm}>
                  Batal
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
          </div>
        ) : loadError ? (
          <section className={styles.errorCard}>
            <p>{loadError}</p>
          </section>
        ) : sorted.length === 0 ? (
          <section className={styles.emptyCard}>
            <p>Belum ada data wilayah.</p>
          </section>
        ) : (
          <section className={styles.list}>
            {sorted.map((w) => (
              <article key={w.wilayah_id} className={styles.item}>
                <div>
                  <h2 className={styles.itemTitle}>{w.nama_wilayah}</h2>
                  <p className={styles.itemSub}>
                    {w.tipe} • {w.totalBalita} balita • {w.stuntingCount} stunting
                  </p>
                </div>
                <div className={styles.itemActions}>
                  <span className={styles.badge}>{w.prevalensi.toFixed(1)}%</span>
                  <button className={styles.editBtn} type="button" onClick={() => startEditWilayah(w)}>
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <MobilePuskesmasNav />
    </div>
  );
}
