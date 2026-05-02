import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Route } from "./+types/puskesmas.wilayah";
import { DashboardLayout } from "~/components/dashboard-layout";
import { getCurrentUser } from "~/utils/auth";
import { Button } from "~/components/ui/button/button";
import styles from "./puskesmas.wilayah.module.css";

type WilayahStats = {
  wilayah_id: string;
  nama_wilayah: string;
  tipe: "desa" | "kelurahan" | "puskesmas";
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
  return [{ title: "Wilayah - Desktop Puskesmas" }];
}

export default function PuskesmasWilayahPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wilayahStats, setWilayahStats] = useState<WilayahStats[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [namaWilayah, setNamaWilayah] = useState("");
  const [tipeWilayah, setTipeWilayah] = useState<WilayahType>("desa");
  const [editingWilayahId, setEditingWilayahId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => [...wilayahStats].sort((a, b) => b.prevalensi - a.prevalensi), [wilayahStats]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await puskesmasApi.getWilayahStats();
      setWilayahStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLoadError("Gagal memuat data wilayah.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWilayah = async () => {
    if (!namaWilayah.trim()) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("intent", "create-wilayah");
      fd.append("data", JSON.stringify({ nama_wilayah: namaWilayah.trim(), tipe: tipeWilayah }));
      await puskesmasApi.createWilayah(fd);
      setNamaWilayah("");
      setTipeWilayah("desa");
      setShowForm(false);
      await loadData();
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
    if (!editingWilayahId || !namaWilayah.trim()) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("intent", "update-wilayah");
      fd.append("id", editingWilayahId);
      fd.append("data", JSON.stringify({ nama_wilayah: namaWilayah.trim(), tipe: tipeWilayah }));
      await puskesmasApi.createWilayah(fd);
      await loadData();
      cancelForm();
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((u) => {
      if (!mounted) return;
      if (u?.role === "puskesmas") loadData();
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <section className={styles.headerCard}>
          <h1 className={styles.title}>Wilayah</h1>
          <div className={styles.headerActions}>
            <Button variant="outline" onClick={() => setShowForm((v) => !v)}>{showForm ? "Tutup Form" : "Tambah Wilayah"}</Button>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={styles.btnIcon} />
              Refresh
            </Button>
          </div>
        </section>

        {showForm ? (
          <section className={styles.formCard}>
            <h3 className={styles.formTitle}>{editingWilayahId ? "Edit Wilayah" : "Tambah Wilayah Baru"}</h3>
            <input className={styles.input} value={namaWilayah} onChange={(e) => setNamaWilayah(e.target.value)} placeholder="Nama wilayah" />
            <select className={styles.input} value={tipeWilayah} onChange={(e) => setTipeWilayah(e.target.value as WilayahType)}>
              <option value="desa">Desa</option>
              <option value="kelurahan">Kelurahan</option>
              <option value="puskesmas">Puskesmas</option>
            </select>
            <div className={styles.formActions}>
              <Button onClick={editingWilayahId ? handleUpdateWilayah : handleCreateWilayah} disabled={saving}>
                {saving ? "Menyimpan..." : editingWilayahId ? "Simpan Perubahan" : "Simpan Wilayah"}
              </Button>
              {editingWilayahId ? (
                <Button variant="outline" onClick={cancelForm} disabled={saving}>
                  Batal
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className={styles.tableCard}>
          {loading ? <p className={styles.emptyText}>Memuat data...</p> : null}
          {!loading && loadError ? <p className={styles.emptyText}>{loadError}</p> : null}
          {!loading && !loadError && sorted.length === 0 ? <p className={styles.emptyText}>Belum ada data wilayah.</p> : null}
          {!loading && !loadError && sorted.length > 0 ? (
            <table className={styles.table}>
              <thead><tr><th>Wilayah</th><th>Tipe</th><th>Total Balita</th><th>Stunting</th><th>Prevalensi</th><th>Aksi</th></tr></thead>
              <tbody>
                {sorted.map((w) => (
                  <tr key={w.wilayah_id}>
                    <td>{w.nama_wilayah}</td>
                    <td>{w.tipe}</td>
                    <td>{w.totalBalita}</td>
                    <td>{w.stuntingCount}</td>
                    <td>{w.prevalensi.toFixed(1)}%</td>
                    <td>
                      <Button variant="outline" size="sm" onClick={() => startEditWilayah(w)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
}
