import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/m.puskesmas.kader";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobilePuskesmasNav } from "~/components/mobile-puskesmas-nav";
import styles from "./m.puskesmas.kader.module.css";

type KaderItem = {
  id: string;
  name: string;
  email: string;
  wilayah_id: string | null;
  wilayah_name: string | null;
  totalBalita: number;
  totalPemeriksaan: number;
};

type WilayahItem = {
  id: string;
  nama_wilayah: string;
};

const puskesmasApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getKaders: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=kaders"),
  getWilayah: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=wilayah"),
  createKader: (formData: FormData) =>
    puskesmasApi.fetchWithError("/api/puskesmas/dashboard", {
      method: "POST",
      body: formData,
    }),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kader - Puskesmas Anting" },
    { name: "description", content: "Daftar kader posyandu pada puskesmas" },
  ];
}

export default function MobilePuskesmasKaderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    try {
      setLoading(true);
      setLoadError(null);
      const [kaderData, wilayahData] = await Promise.all([puskesmasApi.getKaders(), puskesmasApi.getWilayah()]);
      setKaders(Array.isArray(kaderData) ? kaderData : []);
      const wilayahItems = Array.isArray(wilayahData) ? wilayahData : [];
      setWilayahList(wilayahItems);
      if (!wilayahId && wilayahItems.length > 0) {
        setWilayahId(wilayahItems[0].id);
      }
    } catch (error) {
      console.error(error);
      setLoadError("Gagal memuat data kader.");
      toast({ title: "Error", description: "Gagal memuat data kader", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKader = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !wilayahId) {
      toast({ title: "Data belum lengkap", description: "Nama, email, password, dan wilayah wajib diisi.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("intent", "create-kader");
      formData.append(
        "data",
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          wilayahId,
        })
      );
      await puskesmasApi.createKader(formData);
      setName("");
      setEmail("");
      setPassword("");
      setShowForm(false);
      await loadData();
      toast({ title: "Berhasil", description: "Kader baru berhasil ditambahkan." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal", description: "Tidak bisa menambah kader saat ini.", variant: "destructive" });
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

  const handleUpdateKader = async () => {
    if (!editingKaderId || !name.trim() || !email.trim() || !wilayahId) {
      toast({ title: "Data belum lengkap", description: "Nama, email, dan wilayah wajib diisi.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("intent", "update-kader");
      formData.append("id", editingKaderId);
      formData.append(
        "data",
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          wilayahId,
        })
      );
      await puskesmasApi.createKader(formData);
      await loadData();
      cancelForm();
      toast({ title: "Berhasil", description: "Data kader berhasil diperbarui." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal", description: "Tidak bisa memperbarui kader saat ini.", variant: "destructive" });
    } finally {
      setSaving(false);
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
        <h1 className={styles.title}>Kader</h1>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Tutup Form" : "Tambah Kader"}
          </button>
          <button className={styles.refreshBtn} type="button" onClick={loadData}>
            Refresh
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {showForm ? (
          <section className={styles.formCard}>
            <h2 className={styles.formTitle}>{editingKaderId ? "Edit Kader" : "Tambah Kader Baru"}</h2>
            <label className={styles.label}>Nama</label>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kader" />
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingKaderId ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
            />
            <label className={styles.label}>Wilayah</label>
            <select className={styles.input} value={wilayahId} onChange={(e) => setWilayahId(e.target.value)}>
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama_wilayah}
                </option>
              ))}
            </select>
            <div className={styles.formActions}>
              <button className={styles.submitBtn} type="button" disabled={saving} onClick={editingKaderId ? handleUpdateKader : handleCreateKader}>
                {saving ? "Menyimpan..." : editingKaderId ? "Simpan Perubahan" : "Simpan Kader"}
              </button>
              {editingKaderId ? (
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
        ) : kaders.length === 0 ? (
          <section className={styles.emptyCard}>
            <p>Belum ada data kader.</p>
          </section>
        ) : (
          <section className={styles.list}>
            {kaders.map((kader) => (
              <article key={kader.id} className={styles.item}>
                <div>
                  <h2 className={styles.itemTitle}>{kader.name}</h2>
                  <p className={styles.itemSub}>{kader.wilayah_name || "Wilayah tidak tersedia"}</p>
                  <p className={styles.itemMeta}>{kader.email}</p>
                </div>
                <div className={styles.metrics}>
                  <span>{kader.totalBalita} balita</span>
                  <span>{kader.totalPemeriksaan} pemeriksaan</span>
                  <button className={styles.editBtn} type="button" onClick={() => startEditKader(kader)}>
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
