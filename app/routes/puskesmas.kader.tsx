import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Route } from "./+types/puskesmas.kader";
import { DashboardLayout } from "~/components/dashboard-layout";
import { getCurrentUser } from "~/utils/auth";
import { Button } from "~/components/ui/button/button";
import styles from "./puskesmas.kader.module.css";

type KaderItem = {
  id: string;
  name: string;
  email: string;
  wilayah_id: string | null;
  wilayah_name: string | null;
  totalBalita: number;
  totalPemeriksaan: number;
};
type WilayahItem = { id: string; nama_wilayah: string };

const api = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  getKaders: () => api.fetchWithError("/api/puskesmas/dashboard?action=kaders"),
  getWilayah: () => api.fetchWithError("/api/puskesmas/dashboard?action=wilayah"),
  create: (fd: FormData) => api.fetchWithError("/api/puskesmas/dashboard", { method: "POST", body: fd }),
};

export function meta({}: Route.MetaArgs) { return [{ title: "Kader - Desktop Puskesmas" }]; }

export default function PuskesmasKaderPage() {
  const [loading, setLoading] = useState(true);
  const [kaders, setKaders] = useState<KaderItem[]>([]);
  const [wilayahList, setWilayahList] = useState<WilayahItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wilayahId, setWilayahId] = useState("");
  const [editingKaderId, setEditingKaderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kaderData, wilayahData] = await Promise.all([api.getKaders(), api.getWilayah()]);
      setKaders(Array.isArray(kaderData) ? kaderData : []);
      const w = Array.isArray(wilayahData) ? wilayahData : [];
      setWilayahList(w);
      if (!wilayahId && w.length > 0) setWilayahId(w[0].id);
    } finally {
      setLoading(false);
    }
  };

  const createKader = async () => {
    if (!name.trim() || !email.trim() || !password || !wilayahId) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("intent", "create-kader");
      fd.append("data", JSON.stringify({ name: name.trim(), email: email.trim(), password, wilayahId }));
      await api.create(fd);
      setName(""); setEmail(""); setPassword(""); setShowForm(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const startEditKader = (kader: KaderItem) => {
    setEditingKaderId(kader.id);
    setName(kader.name);
    setEmail(kader.email);
    setPassword("");
    setWilayahId(kader.wilayah_id || wilayahList[0]?.id || "");
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingKaderId(null);
    setName("");
    setEmail("");
    setPassword("");
  };

  const updateKader = async () => {
    if (!editingKaderId || !name.trim() || !email.trim() || !wilayahId) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("intent", "update-kader");
      fd.append("id", editingKaderId);
      fd.append(
        "data",
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          wilayahId,
          password,
        })
      );
      await api.create(fd);
      await loadData();
      cancelForm();
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((u) => { if (mounted && u?.role === "puskesmas") loadData(); });
    return () => { mounted = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <section className={styles.headerCard}>
          <h1 className={styles.title}>Kader</h1>
          <div className={styles.headerActions}>
            <Button variant="outline" onClick={() => setShowForm((v) => !v)}>{showForm ? "Tutup Form" : "Tambah Kader"}</Button>
            <Button variant="outline" onClick={loadData} disabled={loading}><RefreshCw className={styles.btnIcon} />Refresh</Button>
          </div>
        </section>

        {showForm ? (
          <section className={styles.formCard}>
            <h3 className={styles.formTitle}>{editingKaderId ? "Edit Kader" : "Tambah Kader Baru"}</h3>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kader" />
            <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingKaderId ? "Password baru (opsional)" : "Password"}
            />
            <select className={styles.input} value={wilayahId} onChange={(e) => setWilayahId(e.target.value)}>
              {wilayahList.map((w) => <option key={w.id} value={w.id}>{w.nama_wilayah}</option>)}
            </select>
            <div className={styles.formActions}>
              <Button onClick={editingKaderId ? updateKader : createKader} disabled={saving}>
                {saving ? "Menyimpan..." : editingKaderId ? "Simpan Perubahan" : "Simpan Kader"}
              </Button>
              {editingKaderId ? (
                <Button variant="outline" onClick={cancelForm} disabled={saving}>
                  Batal
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className={styles.tableCard}>
          {loading ? <p className={styles.emptyText}>Memuat data...</p> : null}
          {!loading && kaders.length === 0 ? <p className={styles.emptyText}>Belum ada data kader.</p> : null}
          {!loading && kaders.length > 0 ? (
            <table className={styles.table}>
              <thead><tr><th>Nama</th><th>Email</th><th>Wilayah</th><th>Balita</th><th>Pemeriksaan</th><th>Aksi</th></tr></thead>
              <tbody>
                {kaders.map((k) => (
                  <tr key={k.id}>
                    <td>{k.name}</td>
                    <td>{k.email}</td>
                    <td>{k.wilayah_name || "-"}</td>
                    <td>{k.totalBalita}</td>
                    <td>{k.totalPemeriksaan}</td>
                    <td>
                      <Button variant="outline" size="sm" onClick={() => startEditKader(k)}>
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
