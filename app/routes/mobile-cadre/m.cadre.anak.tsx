import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/m.cadre.anak";
import type { Database } from "~/db/types";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { MobileCadreNav } from "~/components/mobile-cadre-nav";
import { PertumbuhanFormDialog } from "~/components/pertumbuhan-form-dialog";
import { ImunisasiFormDialog } from "~/components/imunisasi-form-dialog";
import styles from "./m.cadre.anak.module.css";

type AnakRow = any;
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
  getAnak: (wilayahId: string) =>
    cadreApi.fetchWithError(`/api/cadre/dashboard?action=anak&wilayahId=${encodeURIComponent(wilayahId)}`),
  submitAction: async (formData: FormData) => {
    const r = await fetch("/api/cadre/dashboard", { method: "POST", body: formData });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
};

type FilterType = "all" | "normal" | "perlu-perhatian" | "prioritas-tinggi" | "jadwal-kunjungan";
type ReminderMap = Record<string, string>;

function calculateAgeMonths(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  return months < 0 ? 0 : months;
}

function needsAttention(anak: AnakRow) {
  const p = anak.latest_pertumbuhan;
  if (!p) return false;
  return (
    (p.zscore_tbu !== null && p.zscore_tbu < -2) ||
    (p.zscore_bbu !== null && p.zscore_bbu < -2) ||
    (p.zscore_bbtb !== null && p.zscore_bbtb < -2)
  );
}

function getRiskScore(anak: AnakRow) {
  const p = anak.latest_pertumbuhan;
  if (!p) return 0;

  const zscores = [p.zscore_tbu, p.zscore_bbu, p.zscore_bbtb].filter((v: number | null) => typeof v === "number");
  const minZ = zscores.length > 0 ? Math.min(...zscores) : 0;
  let score = 0;

  if (minZ <= -3) score += 3;
  else if (minZ <= -2) score += 2;

  if (typeof p.lila_cm === "number" && p.lila_cm > 0) {
    if (p.lila_cm < 12.5) score += 2;
    else if (p.lila_cm < 13.5) score += 1;
  }

  if (p.tanggal_pengukuran) {
    const days = Math.floor((Date.now() - new Date(p.tanggal_pengukuran).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 45) score += 1;
  }

  return score;
}

function getReminderState(reminderDate?: string): "none" | "today" | "overdue" | "upcoming" {
  if (!reminderDate) return "none";
  const normalized = reminderDate.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (normalized === today) return "today";
  if (normalized < today) return "overdue";
  return "upcoming";
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Daftar Anak - Kader" }, { name: "description", content: "Anak di wilayah binaan" }];
}

export default function MobileCadreAnakPage() {
  const navigate = useNavigate();
  const [wilayahId, setWilayahId] = useState<string | null>(null);
  const [anakList, setAnakList] = useState<AnakRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedAnakId, setSelectedAnakId] = useState<string | null>(null);
  const [showPertumbuhan, setShowPertumbuhan] = useState(false);
  const [showImunisasi, setShowImunisasi] = useState(false);
  const [reminderDrafts, setReminderDrafts] = useState<ReminderMap>({});

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

  const loadAnak = useCallback(async (wid: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await cadreApi.getAnak(wid);
      setAnakList(data);
    } catch (e) {
      console.error(e);
      setLoadError("Gagal memuat daftar anak.");
      toast({ title: "Error", description: "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (wilayahId) loadAnak(wilayahId);
  }, [wilayahId, loadAnak]);

  const filtered = useMemo(() => {
    const list = anakList.filter((anak) => {
      const q = searchQuery.trim().toLowerCase();
      const match =
        !q ||
        String(anak.nama).toLowerCase().includes(q) ||
        String(anak.parent_name || "").toLowerCase().includes(q);
      if (!match) return false;

      const att = needsAttention(anak);
      const riskScore = getRiskScore(anak);
      const reminderState = getReminderState(anak.reminder_kunjungan);

      if (filter === "all") return true;
      if (filter === "perlu-perhatian") return att;
      if (filter === "normal") return !att;
      if (filter === "prioritas-tinggi") return riskScore >= 3;
      if (filter === "jadwal-kunjungan") return reminderState !== "none";
      return true;
    });

    return list.sort((a, b) => {
      const riskDiff = getRiskScore(b) - getRiskScore(a);
      if (riskDiff !== 0) return riskDiff;

      const aState = getReminderState(a.reminder_kunjungan);
      const bState = getReminderState(b.reminder_kunjungan);
      const stateScore = (s: string) => (s === "overdue" ? 3 : s === "today" ? 2 : s === "upcoming" ? 1 : 0);
      const reminderDiff = stateScore(bState) - stateScore(aState);
      if (reminderDiff !== 0) return reminderDiff;

      return String(a.nama).localeCompare(String(b.nama), "id");
    });
  }, [anakList, searchQuery, filter]);

  const handlePertumbuhanSubmit = async (data: PertumbuhanInsert) => {
    const fd = new FormData();
    fd.append("intent", "create-pertumbuhan");
    fd.append("data", JSON.stringify(data));
    await cadreApi.submitAction(fd);
    setShowPertumbuhan(false);
    setSelectedAnakId(null);
    if (wilayahId) await loadAnak(wilayahId);
    toast({ title: "Tersimpan", description: "Data pemeriksaan BB/TB berhasil dicatat." });
  };

  const handleImunisasiSubmit = async (data: ImunisasiInsert) => {
    const fd = new FormData();
    fd.append("intent", "create-imunisasi");
    fd.append("data", JSON.stringify(data));
    await cadreApi.submitAction(fd);
    setShowImunisasi(false);
    setSelectedAnakId(null);
    if (wilayahId) await loadAnak(wilayahId);
    toast({ title: "Tersimpan", description: "Data imunisasi berhasil dicatat." });
  };

  const saveReminder = async (anakId: string) => {
    const date = reminderDrafts[anakId];
    if (!date) {
      toast({ title: "Tanggal wajib diisi", description: "Pilih tanggal kunjungan terlebih dahulu.", variant: "destructive" });
      return;
    }
    try {
      const fd = new FormData();
      fd.append("intent", "set-kunjungan-reminder");
      fd.append(
        "data",
        JSON.stringify({
          anak_id: anakId,
          tanggal_kunjungan: date,
        })
      );
      await cadreApi.submitAction(fd);
      if (wilayahId) await loadAnak(wilayahId);
      toast({ title: "Reminder disimpan", description: "Jadwal kunjungan berhasil diatur." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menyimpan", description: "Reminder kunjungan belum bisa disimpan.", variant: "destructive" });
    }
  };

  const clearReminder = async (anakId: string) => {
    try {
      const fd = new FormData();
      fd.append("intent", "clear-kunjungan-reminder");
      fd.append("anak_id", anakId);
      await cadreApi.submitAction(fd);
      if (wilayahId) await loadAnak(wilayahId);
      toast({ title: "Reminder dihapus", description: "Jadwal kunjungan dibersihkan." });
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menghapus", description: "Reminder kunjungan belum bisa dihapus.", variant: "destructive" });
    }

    setReminderDrafts((prev) => {
      const next = { ...prev };
      delete next[anakId];
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Daftar Anak</h1>
        <p className={styles.subtitle}>Wilayah binaan — cari nama atau orang tua</p>
      </header>

      <main className={styles.main}>
        {loading && anakList.length === 0 ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
          </div>
        ) : loadError && anakList.length === 0 ? (
          <div className={styles.errorCard}>
            <p>{loadError}</p>
            <button type="button" className={styles.retryBtn} onClick={() => wilayahId && loadAnak(wilayahId)}>
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <div className={styles.searchWrap}>
              <span className={`${styles.icon} ${styles.searchIcon}`}>search</span>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="Cari nama anak atau orang tua..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className={styles.filterRow}>
              <button
                type="button"
                className={filter === "all" ? styles.filterBtnActive : styles.filterBtn}
                onClick={() => setFilter("all")}
              >
                Semua ({anakList.length})
              </button>
              <button
                type="button"
                className={filter === "normal" ? styles.filterBtnActive : styles.filterBtn}
                onClick={() => setFilter("normal")}
              >
                Normal
              </button>
              <button
                type="button"
                className={filter === "perlu-perhatian" ? styles.filterBtnActive : styles.filterBtn}
                onClick={() => setFilter("perlu-perhatian")}
              >
                Perlu perhatian
              </button>
              <button
                type="button"
                className={filter === "prioritas-tinggi" ? styles.filterBtnActive : styles.filterBtn}
                onClick={() => setFilter("prioritas-tinggi")}
              >
                Prioritas tinggi
              </button>
              <button
                type="button"
                className={filter === "jadwal-kunjungan" ? styles.filterBtnActive : styles.filterBtn}
                onClick={() => setFilter("jadwal-kunjungan")}
              >
                Jadwal kunjungan
              </button>
            </div>

            {filtered.length === 0 ? (
              <p className={styles.empty}>{searchQuery ? "Tidak ada hasil pencarian." : "Belum ada data anak."}</p>
            ) : (
              <div className={styles.cardList}>
                {filtered.map((anak) => {
                  const att = needsAttention(anak);
                  const riskScore = getRiskScore(anak);
                  const p = anak.latest_pertumbuhan;
                  const reminderDate = anak.reminder_kunjungan;
                  const reminderState = getReminderState(reminderDate);
                  return (
                    <article key={anak.id} className={styles.card} data-attention={att ? 1 : 0}>
                      <div className={styles.cardHead}>
                        <div>
                          <h2 className={styles.cardName}>{anak.nama}</h2>
                          <p className={styles.cardParent}>Orang tua: {anak.parent_name || "—"}</p>
                        </div>
                        {!p ? (
                          <span className={styles.badgeNone}>Belum ada data</span>
                        ) : riskScore >= 3 ? (
                          <span className={styles.badgeDanger}>Prioritas tinggi</span>
                        ) : att ? (
                          <span className={styles.badgeWarn}>Perlu perhatian</span>
                        ) : (
                          <span className={styles.badgeNormal}>Normal</span>
                        )}
                      </div>
                      <div className={styles.metaRow}>
                        <span>Umur: {calculateAgeMonths(anak.tanggal_lahir)} bln</span>
                        <span>JK: {anak.jenis_kelamin === "laki_laki" ? "L" : "P"}</span>
                        {p && (
                          <>
                            <span>BB: {p.berat_badan} kg</span>
                            <span>TB: {p.tinggi_badan} cm</span>
                          </>
                        )}
                      </div>
                      <div className={styles.reminderWrap}>
                        <div className={styles.reminderHead}>
                          <span className={styles.reminderTitle}>Reminder kunjungan</span>
                          {reminderState === "overdue" ? (
                            <span className={styles.reminderBadgeOverdue}>Terlewat</span>
                          ) : reminderState === "today" ? (
                            <span className={styles.reminderBadgeToday}>Hari ini</span>
                          ) : reminderState === "upcoming" ? (
                            <span className={styles.reminderBadgeUpcoming}>Akan datang</span>
                          ) : (
                            <span className={styles.reminderMuted}>Belum dijadwalkan</span>
                          )}
                        </div>
                        <div className={styles.reminderRow}>
                          <input
                            className={styles.reminderInput}
                            type="date"
                            value={reminderDrafts[anak.id] ?? (reminderDate ? reminderDate.slice(0, 10) : "")}
                            onChange={(e) =>
                              setReminderDrafts((prev) => ({
                                ...prev,
                                [anak.id]: e.target.value,
                              }))
                            }
                          />
                          <button type="button" className={styles.reminderBtn} onClick={() => saveReminder(anak.id)}>
                            Simpan
                          </button>
                          {reminderDate ? (
                            <button type="button" className={styles.reminderBtnGhost} onClick={() => clearReminder(anak.id)}>
                              Hapus
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <Link className={styles.profileLink} to={`/m/cadre/anak/${anak.id}`}>
                        <span className={styles.icon} style={{ fontSize: "1rem" }} aria-hidden>
                          account_circle
                        </span>
                        Lihat profil lengkap
                      </Link>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionPrimary}
                          onClick={() => {
                            setSelectedAnakId(anak.id);
                            setShowPertumbuhan(true);
                          }}
                        >
                          <span className={styles.icon} style={{ fontSize: "1.1rem" }} aria-hidden>
                            monitor_weight
                          </span>
                          BB/TB
                        </button>
                        <button
                          type="button"
                          className={styles.actionPrimary}
                          onClick={() => {
                            setSelectedAnakId(anak.id);
                            setShowImunisasi(true);
                          }}
                        >
                          <span className={styles.icon} style={{ fontSize: "1.1rem" }} aria-hidden>
                            vaccines
                          </span>
                          Imunisasi
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {selectedAnakId && (
        <>
          <PertumbuhanFormDialog
            open={showPertumbuhan}
            onOpenChange={setShowPertumbuhan}
            anakId={selectedAnakId}
            onSubmit={handlePertumbuhanSubmit}
          />
          <ImunisasiFormDialog
            open={showImunisasi}
            onOpenChange={setShowImunisasi}
            anakId={selectedAnakId}
            onSubmit={handleImunisasiSubmit}
          />
        </>
      )}

      <MobileCadreNav />
    </div>
  );
}
