import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobilePuskesmasNav } from "~/components/mobile-puskesmas-nav";
import { resizeImageToDataUrl } from "~/utils/image-client";
import styles from "../mobile-informasi.module.css";

type FilterType = "all" | "kegiatan" | "penyuluhan" | "gizi" | "pengumuman";

const puskesmasApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
  getInformasi: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=informasi"),
  createInformasi: (formData: FormData) =>
    puskesmasApi.fetchWithError("/api/puskesmas/dashboard", {
      method: "POST",
      body: formData,
    }),
  updateInformasi: (formData: FormData) =>
    puskesmasApi.fetchWithError("/api/puskesmas/dashboard", {
      method: "POST",
      body: formData,
    }),
  deleteInformasi: (formData: FormData) =>
    puskesmasApi.fetchWithError("/api/puskesmas/dashboard", {
      method: "POST",
      body: formData,
    }),
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

export default function MobilePuskesmasInformasiPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState<FilterType>("kegiatan");
  const [konten, setKonten] = useState("");
  const [tanggalKegiatan, setTanggalKegiatan] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [gambarDataUrl, setGambarDataUrl] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; judul: string } | null>(null);

  const loadInformasi = async () => {
    const data = await puskesmasApi.getInformasi();
    setList(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted) return;
        if (!user || user.role !== "puskesmas") {
          navigate("/login", { replace: true });
          return;
        }
        setCurrentUserId(user.id);
        await loadInformasi();
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

  const submitInformasi = async () => {
    if (!judul.trim() || !konten.trim() || kategori === "all") {
      toast({ title: "Data belum lengkap", description: "Judul, kategori, dan konten wajib diisi.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("intent", editingId ? "update-informasi" : "create-informasi");
      formData.append(
        "data",
        JSON.stringify({
          id: editingId,
          judul: judul.trim(),
          kategori,
          konten: konten.trim(),
          gambar_data_url: gambarDataUrl,
          tanggal_kegiatan: tanggalKegiatan || null,
          lokasi: lokasi.trim(),
          is_pinned: isPinned,
        })
      );
      if (editingId) {
        await puskesmasApi.updateInformasi(formData);
      } else {
        await puskesmasApi.createInformasi(formData);
      }
      setJudul("");
      setKategori("kegiatan");
      setKonten("");
      setTanggalKegiatan("");
      setLokasi("");
      setGambarDataUrl(null);
      setIsPinned(false);
      setEditingId(null);
      await loadInformasi();
      toast({ title: "Berhasil", description: editingId ? "Informasi berhasil diperbarui." : "Informasi berhasil dipublikasikan." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal", description: "Informasi belum bisa disimpan.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onSelectGambar = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "File tidak valid", description: "Pilih file gambar (jpg/png/webp).", variant: "destructive" });
      return;
    }
    try {
      const resized = await resizeImageToDataUrl(file);
      setGambarDataUrl(resized);
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal", description: "Gagal memproses gambar.", variant: "destructive" });
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setJudul(item.judul || "");
    setKategori((item.kategori || "kegiatan") as FilterType);
    setKonten(item.konten || "");
    setGambarDataUrl(item.gambar_data_url || null);
    setTanggalKegiatan(item.tanggal_kegiatan ? String(item.tanggal_kegiatan).slice(0, 10) : "");
    setLokasi(item.lokasi || "");
    setIsPinned(Boolean(item.is_pinned));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setJudul("");
    setKategori("kegiatan");
    setKonten("");
    setGambarDataUrl(null);
    setTanggalKegiatan("");
    setLokasi("");
    setIsPinned(false);
  };

  const removeInformasi = async (id: string) => {
    try {
      const formData = new FormData();
      formData.append("intent", "delete-informasi");
      formData.append("id", id);
      await puskesmasApi.deleteInformasi(formData);
      if (editingId === id) cancelEdit();
      await loadInformasi();
      toast({ title: "Berhasil", description: "Informasi berhasil dihapus." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal", description: "Informasi belum bisa dihapus.", variant: "destructive" });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Informasi</h1>
        <p className={styles.subtitle}>Publikasi resmi kegiatan, penyuluhan, dan edukasi gizi.</p>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>{editingId ? "Edit Informasi" : "Publikasi Baru"}</h2>
          <div className={styles.form}>
            <label className={styles.label}>Judul</label>
            <input className={styles.input} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Jadwal Posyandu Mei 2026" />

            <label className={styles.label}>Kategori</label>
            <div className={styles.categoryRow}>
              <button
                type="button"
                className={kategori === "kegiatan" ? styles.categoryBtnActive : styles.categoryBtn}
                onClick={() => setKategori("kegiatan")}
              >
                Kegiatan
              </button>
              <button
                type="button"
                className={kategori === "penyuluhan" ? styles.categoryBtnActive : styles.categoryBtn}
                onClick={() => setKategori("penyuluhan")}
              >
                Penyuluhan
              </button>
              <button
                type="button"
                className={kategori === "gizi" ? styles.categoryBtnActive : styles.categoryBtn}
                onClick={() => setKategori("gizi")}
              >
                Gizi
              </button>
              <button
                type="button"
                className={kategori === "pengumuman" ? styles.categoryBtnActive : styles.categoryBtn}
                onClick={() => setKategori("pengumuman")}
              >
                Pengumuman
              </button>
            </div>

            <label className={styles.label}>Tanggal Kegiatan (opsional)</label>
            <input className={styles.input} type="date" value={tanggalKegiatan} onChange={(e) => setTanggalKegiatan(e.target.value)} />

            <label className={styles.label}>Lokasi (opsional)</label>
            <input className={styles.input} value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Aula Puskesmas" />

            <label className={styles.label}>Konten</label>
            <textarea className={styles.textarea} value={konten} onChange={(e) => setKonten(e.target.value)} placeholder="Isi informasi..." />

            <label className={styles.label}>Foto/Gambar (opsional)</label>
            <input className={styles.input} type="file" accept="image/*" onChange={(e) => onSelectGambar(e.target.files?.[0])} />
            {gambarDataUrl ? (
              <>
                <img src={gambarDataUrl} alt="Preview informasi" className={styles.imagePreview} />
                <button type="button" className={styles.cancelBtn} onClick={() => setGambarDataUrl(null)}>
                  Hapus Gambar
                </button>
              </>
            ) : null}

            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
              Pin di urutan atas
            </label>

            <button type="button" className={styles.submitBtn} disabled={saving} onClick={submitInformasi}>
              {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Publikasikan"}
            </button>
            {editingId ? (
              <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
                Batal Edit
              </button>
            ) : null}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Feed Informasi</h2>
          <div className={styles.filterRow}>
            {(["all", "kegiatan", "penyuluhan", "gizi", "pengumuman"] as FilterType[]).map((f) => (
              <button key={f} type="button" className={filter === f ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter(f)}>
                {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <p className={styles.empty}>Memuat informasi...</p>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>Belum ada informasi.</p>
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
                        {item.is_pinned ? " • Dipin" : ""}
                      </p>
                    </div>
                    <span className={badgeClass(item.kategori)}>{item.kategori}</span>
                  </div>
                  {item.gambar_data_url ? (
                    <img src={item.gambar_data_url} alt={`Gambar ${item.judul}`} className={styles.itemImage} />
                  ) : null}
                  <p className={styles.itemContent}>{item.konten}</p>
                  {item.created_by_user_id === currentUserId ? (
                    <div className={styles.itemActions}>
                      <button type="button" className={styles.itemActionBtn} onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.itemActionBtnDanger}
                        onClick={() => setDeleteTarget({ id: item.id, judul: item.judul || "informasi ini" })}
                      >
                        Hapus
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {deleteTarget ? (
        <div className={styles.confirmBackdrop} onClick={() => setDeleteTarget(null)}>
          <section className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.sectionTitle}>Konfirmasi Hapus</h3>
            <p className={styles.confirmText}>
              Yakin ingin menghapus <strong>{deleteTarget.judul}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>
                Batal
              </button>
              <button
                type="button"
                className={styles.itemActionBtnDanger}
                onClick={async () => {
                  const id = deleteTarget.id;
                  setDeleteTarget(null);
                  await removeInformasi(id);
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <MobilePuskesmasNav />
    </div>
  );
}
