import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/m.cadre.anak.$anakId";
import type { Database } from "~/db/types";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { toIndonesianNutritionStatus } from "~/utils/nutrition-status";
import { MobileCadreNav } from "~/components/mobile-cadre-nav";
import { PertumbuhanFormDialog } from "~/components/pertumbuhan-form-dialog";
import { ImunisasiFormDialog } from "~/components/imunisasi-form-dialog";
import styles from "./m.cadre.anak.$anakId.module.css";

type PertumbuhanInsert = Database["public"]["Tables"]["pertumbuhan"]["Insert"];
type ImunisasiInsert = Database["public"]["Tables"]["imunisasi"]["Insert"];

const cadreApi = {
  fetchWithError: async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getAnakDetail: (wilayahId: string, anakId: string) =>
    cadreApi.fetchWithError(
      `/api/cadre/dashboard?action=anak-detail&wilayahId=${encodeURIComponent(wilayahId)}&anakId=${encodeURIComponent(anakId)}`
    ),
  submitAction: async (formData: FormData) => {
    const r = await fetch("/api/cadre/dashboard", { method: "POST", body: formData });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
};

function formatTanggal(tanggal: string) {
  return new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function calculateAgeMonths(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  return months < 0 ? 0 : months;
}

function needsAttention(anak: any) {
  const p = anak.latest_pertumbuhan;
  if (!p) return false;
  return (
    (p.zscore_tbu !== null && p.zscore_tbu < -2) ||
    (p.zscore_bbu !== null && p.zscore_bbu < -2) ||
    (p.zscore_bbtb !== null && p.zscore_bbtb < -2)
  );
}

function getNutritionTone(status: string | null | undefined): "normal" | "warning" | "danger" | "none" {
  if (!status) return "none";
  const v = status.toLowerCase();
  if (v.includes("severely") || v.includes("wasted") || v.includes("stunted") || v.includes("underweight")) {
    if (v.includes("severely")) return "danger";
    return "warning";
  }
  if (v.includes("normal")) return "normal";
  return "none";
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Profil Anak - Kader" }, { name: "description", content: "Profil pemeriksaan dan imunisasi anak" }];
}

export default function MobileCadreAnakDetailPage() {
  const navigate = useNavigate();
  const { anakId = "" } = useParams();
  const [wilayahId, setWilayahId] = useState<string | null>(null);
  const [anak, setAnak] = useState<any>(null);
  const [profilAnak, setProfilAnak] = useState<any>(null);
  const [pertumbuhan, setPertumbuhan] = useState<any[]>([]);
  const [imunisasi, setImunisasi] = useState<any[]>([]);
  const [intervensi, setIntervensi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPertumbuhan, setShowPertumbuhan] = useState(false);
  const [showImunisasi, setShowImunisasi] = useState(false);
  const [showIntervensi, setShowIntervensi] = useState(false);

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

  const loadDetail = useCallback(async (wid: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await cadreApi.getAnakDetail(wid, anakId);
      setAnak(data.anak);
      setProfilAnak(data.profilAnak ?? null);
      setPertumbuhan(Array.isArray(data.pertumbuhan) ? data.pertumbuhan : []);
      setImunisasi(Array.isArray(data.imunisasi) ? data.imunisasi : []);
      setIntervensi(Array.isArray(data.intervensi) ? data.intervensi : []);
    } catch (e) {
      console.error(e);
      setLoadError("Gagal memuat profil anak.");
      toast({ title: "Error", description: "Gagal memuat profil anak", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [anakId]);

  useEffect(() => {
    if (wilayahId && anakId) loadDetail(wilayahId);
  }, [wilayahId, anakId, loadDetail]);

  const latestPertumbuhan = useMemo(() => pertumbuhan[0] ?? null, [pertumbuhan]);

  const handlePertumbuhanSubmit = async (data: PertumbuhanInsert) => {
    const fd = new FormData();
    fd.append("intent", "create-pertumbuhan");
    fd.append("data", JSON.stringify(data));
    await cadreApi.submitAction(fd);
    setShowPertumbuhan(false);
    if (wilayahId) await loadDetail(wilayahId);
    toast({ title: "Tersimpan", description: "Data BB/TB berhasil ditambahkan." });
  };

  const handleImunisasiSubmit = async (data: ImunisasiInsert) => {
    const fd = new FormData();
    fd.append("intent", "create-imunisasi");
    fd.append("data", JSON.stringify(data));
    await cadreApi.submitAction(fd);
    setShowImunisasi(false);
    if (wilayahId) await loadDetail(wilayahId);
    toast({ title: "Tersimpan", description: "Data imunisasi berhasil ditambahkan." });
  };

  const handleIntervensiSubmit = async (data: {
    tanggal: string;
    jenis: "PKMK" | "VITAMIN" | "ZINC";
    produk: string;
    dosis: string;
    catatan: string;
  }) => {
    const fd = new FormData();
    fd.append("intent", "create-intervensi");
    fd.append(
      "data",
      JSON.stringify({
        anak_id: anakId,
        tanggal: data.tanggal,
        jenis: data.jenis,
        produk: data.produk,
        dosis: data.dosis,
        catatan: data.catatan,
      })
    );
    await cadreApi.submitAction(fd);
    setShowIntervensi(false);
    if (wilayahId) await loadDetail(wilayahId);
    toast({ title: "Tersimpan", description: "Data intervensi gizi berhasil ditambahkan." });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate("/m/cadre/anak")} aria-label="Kembali">
          <span className={styles.icon} aria-hidden>
            arrow_back
          </span>
        </button>
        <div>
          <h1 className={styles.title}>Profil Anak</h1>
          <p className={styles.subtitle}>Detail pemeriksaan dan imunisasi</p>
        </div>
      </header>

      <main className={styles.main}>
        {loading && !anak ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
          </div>
        ) : loadError && !anak ? (
          <div className={styles.errorCard}>
            <p>{loadError}</p>
            <button type="button" className={styles.retryBtn} onClick={() => wilayahId && loadDetail(wilayahId)}>
              Coba Lagi
            </button>
          </div>
        ) : anak ? (
          <>
            <section className={styles.card}>
              <div className={styles.profileHead}>
                <div>
                  <p className={styles.name}>{anak.nama}</p>
                  <p className={styles.meta}>Orang tua: {anak.parent_name || "-"}</p>
                  <p className={styles.meta}>
                    Umur: {calculateAgeMonths(anak.tanggal_lahir)} bln · JK: {anak.jenis_kelamin === "laki_laki" ? "L" : "P"}
                  </p>
                </div>
                {!latestPertumbuhan ? (
                  <span className={styles.badgeNone}>Belum ada data</span>
                ) : needsAttention(anak) ? (
                  <span className={styles.badgeWarn}>Perlu perhatian</span>
                ) : (
                  <span className={styles.badgeNormal}>Normal</span>
                )}
              </div>
              <div className={styles.stats}>
                <span>Catatan BB/TB: {pertumbuhan.length}</span>
                <span>Catatan imunisasi: {imunisasi.length}</span>
                <span>Intervensi gizi: {intervensi.length}</span>
                {latestPertumbuhan ? (
                  <span>
                    Terakhir: {latestPertumbuhan.berat_badan} kg / {latestPertumbuhan.tinggi_badan} cm
                  </span>
                ) : null}
              </div>
              {latestPertumbuhan ? (
                <div className={styles.nutriGroup}>
                  <span className={styles.nutriLabel}>TB/U</span>
                  <span className={styles[`nutriBadge_${getNutritionTone(latestPertumbuhan.kategori_tbu)}`]}>
                    {toIndonesianNutritionStatus(latestPertumbuhan.kategori_tbu)}
                  </span>
                  <span className={styles.nutriLabel}>BB/U</span>
                  <span className={styles[`nutriBadge_${getNutritionTone(latestPertumbuhan.kategori_bbu)}`]}>
                    {toIndonesianNutritionStatus(latestPertumbuhan.kategori_bbu)}
                  </span>
                  <span className={styles.nutriLabel}>BB/TB</span>
                  <span className={styles[`nutriBadge_${getNutritionTone(latestPertumbuhan.kategori_bbtb)}`]}>
                    {toIndonesianNutritionStatus(latestPertumbuhan.kategori_bbtb)}
                  </span>
                </div>
              ) : null}
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Data Profil Anak</h2>
              {profilAnak ? (
                <div className={styles.profileGrid}>
                  <div className={styles.profileItem}>
                    <span className={styles.profileLabel}>NIK Anak</span>
                    <span className={styles.profileValue}>{profilAnak.nik_anak || "-"}</span>
                  </div>
                  <div className={styles.profileItem}>
                    <span className={styles.profileLabel}>Tempat Lahir</span>
                    <span className={styles.profileValue}>{profilAnak.tempat_lahir || "-"}</span>
                  </div>
                  <div className={styles.profileItem}>
                    <span className={styles.profileLabel}>Panjang Lahir</span>
                    <span className={styles.profileValue}>
                      {profilAnak.panjang_lahir_cm !== null && profilAnak.panjang_lahir_cm !== undefined
                        ? `${profilAnak.panjang_lahir_cm} cm`
                        : "-"}
                    </span>
                  </div>
                  <div className={styles.profileItem}>
                    <span className={styles.profileLabel}>Berat Lahir</span>
                    <span className={styles.profileValue}>
                      {profilAnak.berat_lahir_kg !== null && profilAnak.berat_lahir_kg !== undefined
                        ? `${profilAnak.berat_lahir_kg} kg`
                        : "-"}
                    </span>
                  </div>
                  <div className={styles.profileItem}>
                    <span className={styles.profileLabel}>Golongan Darah</span>
                    <span className={styles.profileValue}>{profilAnak.golongan_darah || "-"}</span>
                  </div>
                  <div className={styles.profileItemWide}>
                    <span className={styles.profileLabel}>Alergi</span>
                    <span className={styles.profileValue}>{profilAnak.alergi || "-"}</span>
                  </div>
                  <div className={styles.profileItemWide}>
                    <span className={styles.profileLabel}>Catatan Kesehatan</span>
                    <span className={styles.profileValue}>{profilAnak.catatan_kesehatan || "-"}</span>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>Profil anak belum diisi oleh orang tua.</p>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Tambah Catatan</h2>
              <div className={styles.actionRow}>
                <button type="button" className={styles.actionBtn} onClick={() => setShowPertumbuhan(true)}>
                  <span className={styles.icon} aria-hidden>
                    monitor_weight
                  </span>
                  BB/TB
                </button>
                <button type="button" className={styles.actionBtn} onClick={() => setShowImunisasi(true)}>
                  <span className={styles.icon} aria-hidden>
                    vaccines
                  </span>
                  Imunisasi
                </button>
                <button type="button" className={`${styles.actionBtn} ${styles.actionBtnWide}`} onClick={() => setShowIntervensi(true)}>
                  <span className={styles.icon} aria-hidden>
                    medication
                  </span>
                  PKMK / Vitamin / Zinc
                </button>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Riwayat Pemeriksaan BB/TB</h2>
              {pertumbuhan.length === 0 ? (
                <p className={styles.empty}>Belum ada riwayat pemeriksaan.</p>
              ) : (
                <div className={styles.list}>
                  {pertumbuhan.map((p) => (
                    <div key={p.id} className={styles.item}>
                      <div className={styles.itemTop}>
                        <p className={styles.itemStrong}>
                          {p.berat_badan} kg · {p.tinggi_badan} cm
                        </p>
                        <p className={styles.itemDate}>{formatTanggal(p.tanggal_pengukuran)}</p>
                      </div>
                      <p className={styles.muted}>
                        TB/U: {p.zscore_tbu !== null ? p.zscore_tbu.toFixed(2) : "-"} · BB/U:{" "}
                        {p.zscore_bbu !== null ? p.zscore_bbu.toFixed(2) : "-"} · BB/TB:{" "}
                        {p.zscore_bbtb !== null ? p.zscore_bbtb.toFixed(2) : "-"}
                      </p>
                      <div className={styles.nutriGroup} style={{ marginTop: "0.25rem" }}>
                        <span className={styles.nutriLabel}>TB/U</span>
                        <span className={styles[`nutriBadge_${getNutritionTone(p.kategori_tbu)}`]}>
                          {toIndonesianNutritionStatus(p.kategori_tbu)}
                        </span>
                        <span className={styles.nutriLabel}>BB/U</span>
                        <span className={styles[`nutriBadge_${getNutritionTone(p.kategori_bbu)}`]}>
                          {toIndonesianNutritionStatus(p.kategori_bbu)}
                        </span>
                        <span className={styles.nutriLabel}>BB/TB</span>
                        <span className={styles[`nutriBadge_${getNutritionTone(p.kategori_bbtb)}`]}>
                          {toIndonesianNutritionStatus(p.kategori_bbtb)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Riwayat Imunisasi</h2>
              {imunisasi.length === 0 ? (
                <p className={styles.empty}>Belum ada riwayat imunisasi.</p>
              ) : (
                <div className={styles.list}>
                  {imunisasi.map((i) => (
                    <div key={i.id} className={styles.item}>
                      <div className={styles.itemTop}>
                        <p className={styles.itemStrong}>{i.nama_vaksin || i.nama_imunisasi || "-"}</p>
                        <p className={styles.itemDate}>{formatTanggal(i.tanggal)}</p>
                      </div>
                      {i.keterangan ? <p className={styles.muted}>{i.keterangan}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Riwayat Intervensi Gizi</h2>
              {intervensi.length === 0 ? (
                <p className={styles.empty}>Belum ada riwayat intervensi gizi.</p>
              ) : (
                <div className={styles.list}>
                  {intervensi.map((i) => (
                    <div key={i.id} className={styles.item}>
                      <div className={styles.itemTop}>
                        <p className={styles.itemStrong}>{i.jenis}</p>
                        <p className={styles.itemDate}>{formatTanggal(i.tanggal)}</p>
                      </div>
                      <p className={styles.muted}>
                        Produk: {i.produk || "-"} · Dosis: {i.dosis || "-"} · Catatan: {i.catatan || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>

      {anakId && (
        <>
          <PertumbuhanFormDialog
            open={showPertumbuhan}
            onOpenChange={setShowPertumbuhan}
            anakId={anakId}
            onSubmit={handlePertumbuhanSubmit}
          />
          <ImunisasiFormDialog
            open={showImunisasi}
            onOpenChange={setShowImunisasi}
            anakId={anakId}
            onSubmit={handleImunisasiSubmit}
          />
          <IntervensiFormDialog
            open={showIntervensi}
            onOpenChange={setShowIntervensi}
            onSubmit={handleIntervensiSubmit}
          />
        </>
      )}

      <MobileCadreNav />
    </div>
  );
}

function IntervensiFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { tanggal: string; jenis: "PKMK" | "VITAMIN" | "ZINC"; produk: string; dosis: string; catatan: string }) => Promise<void>;
}) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [jenis, setJenis] = useState<"PKMK" | "VITAMIN" | "ZINC">("PKMK");
  const [produk, setProduk] = useState("");
  const [dosis, setDosis] = useState("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={() => onOpenChange(false)}>
      <section className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.sectionTitle}>Tambah Intervensi Gizi</h3>
          <button type="button" className={styles.modalClose} onClick={() => onOpenChange(false)}>
            ✕
          </button>
        </div>
        <div className={styles.modalForm}>
          <label className={styles.formLabel}>Tanggal</label>
          <input className={styles.formInput} type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />

          <label className={styles.formLabel}>Jenis Intervensi</label>
          <div className={styles.jenisRow}>
            <button
              type="button"
              className={jenis === "PKMK" ? styles.jenisBtnActive : styles.jenisBtn}
              onClick={() => setJenis("PKMK")}
            >
              PKMK
            </button>
            <button
              type="button"
              className={jenis === "VITAMIN" ? styles.jenisBtnActive : styles.jenisBtn}
              onClick={() => setJenis("VITAMIN")}
            >
              Vitamin
            </button>
            <button
              type="button"
              className={jenis === "ZINC" ? styles.jenisBtnActive : styles.jenisBtn}
              onClick={() => setJenis("ZINC")}
            >
              Zinc
            </button>
          </div>

          <label className={styles.formLabel}>Produk</label>
          <input className={styles.formInput} value={produk} onChange={(e) => setProduk(e.target.value)} placeholder="Opsional" />

          <label className={styles.formLabel}>Dosis</label>
          <input className={styles.formInput} value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="Opsional" />

          <label className={styles.formLabel}>Catatan</label>
          <input
            className={styles.formInput}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Opsional"
          />

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => onOpenChange(false)}>
              Batal
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={saving}
              onClick={async () => {
                if (!tanggal || !jenis) {
                  toast({ title: "Data belum lengkap", description: "Tanggal dan jenis intervensi wajib diisi.", variant: "destructive" });
                  return;
                }
                try {
                  setSaving(true);
                  await onSubmit({ tanggal, jenis, produk: produk.trim(), dosis: dosis.trim(), catatan: catatan.trim() });
                  setProduk("");
                  setDosis("");
                  setCatatan("");
                } catch (error) {
                  console.error(error);
                  toast({ title: "Gagal menyimpan", description: "Intervensi gizi belum bisa disimpan.", variant: "destructive" });
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
