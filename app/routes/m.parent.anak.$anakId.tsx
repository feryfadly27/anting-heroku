import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/m.parent.anak.$anakId";
import { getCurrentUser } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import { toIndonesianNutritionAlert, toIndonesianNutritionStatus } from "~/utils/nutrition-status";
import { MobileParentNav } from "~/components/mobile-parent-nav";
import styles from "./m.parent.anak.profile.module.css";

const parentApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getSummaries: () => parentApi.fetchWithError("/api/parent/dashboard?action=summaries"),
  getPertumbuhan: (anakId: string) => parentApi.fetchWithError(`/api/parent/dashboard?action=pertumbuhan&anakId=${anakId}`),
  getImunisasi: (anakId: string) => parentApi.fetchWithError(`/api/parent/dashboard?action=imunisasi&anakId=${anakId}`),
  getIntervensi: (anakId: string) => parentApi.fetchWithError(`/api/parent/dashboard?action=intervensi&anakId=${anakId}`),
  getProfilAnak: (anakId: string) => parentApi.fetchWithError(`/api/parent/profil-anak?anakId=${anakId}`),
  submitAction: (formData: FormData) =>
    parentApi.fetchWithError("/api/parent/dashboard", {
      method: "POST",
      body: formData,
    }),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profil Anak - Anting" },
    { name: "description", content: "Profil anak di aplikasi mobile Anting" },
  ];
}

function calculateAge(tanggalLahir: string): string {
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
  if (diffMonths < 12) return `${diffMonths} bulan`;
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  return months > 0 ? `${years} tahun ${months} bulan` : `${years} tahun`;
}

function formatTanggalIndonesia(tanggal: string): string {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getReminderTone(reminderDate?: string | null): "none" | "today" | "overdue" | "upcoming" {
  if (!reminderDate) return "none";
  const normalized = reminderDate.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (normalized === today) return "today";
  if (normalized < today) return "overdue";
  return "upcoming";
}

export default function MobileAnakProfilePage() {
  const navigate = useNavigate();
  const { anakId } = useParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any | null>(null);
  const [pertumbuhanList, setPertumbuhanList] = useState<any[]>([]);
  const [imunisasiList, setImunisasiList] = useState<any[]>([]);
  const [intervensiList, setIntervensiList] = useState<any[]>([]);
  const [profilAnak, setProfilAnak] = useState<any | null>(null);
  const [showCatatanModal, setShowCatatanModal] = useState(false);
  const [catatanMode, setCatatanMode] = useState<"select" | "pertumbuhan" | "imunisasi" | "intervensi">("select");
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [tanggalPertumbuhan, setTanggalPertumbuhan] = useState(new Date().toISOString().split("T")[0]);
  const [beratBadan, setBeratBadan] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [lilaCm, setLilaCm] = useState("");
  const [tanggalImunisasi, setTanggalImunisasi] = useState(new Date().toISOString().split("T")[0]);
  const [namaImunisasi, setNamaImunisasi] = useState("");
  const [keteranganImunisasi, setKeteranganImunisasi] = useState("");
  const [tanggalIntervensi, setTanggalIntervensi] = useState(new Date().toISOString().split("T")[0]);
  const [jenisIntervensi, setJenisIntervensi] = useState<"PKMK" | "VITAMIN" | "ZINC">("PKMK");
  const [produkIntervensi, setProdukIntervensi] = useState("");
  const [dosisIntervensi, setDosisIntervensi] = useState("");
  const [catatanIntervensi, setCatatanIntervensi] = useState("");
  const [showAllPertumbuhan, setShowAllPertumbuhan] = useState(false);
  const [showAllImunisasi, setShowAllImunisasi] = useState(false);
  const [sortPertumbuhan, setSortPertumbuhan] = useState<"newest" | "oldest">("newest");
  const [sortImunisasi, setSortImunisasi] = useState<"newest" | "oldest">("newest");
  const [monthPertumbuhan, setMonthPertumbuhan] = useState<string>("all");
  const [yearPertumbuhan, setYearPertumbuhan] = useState<string>("all");
  const [monthImunisasi, setMonthImunisasi] = useState<string>("all");
  const [yearImunisasi, setYearImunisasi] = useState<string>("all");
  const monthOptions = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  useEffect(() => {
    let isMounted = true;
    getCurrentUser().then((user) => {
      if (!isMounted) return;
      if (!user || user.role !== "orang_tua") {
        navigate("/login", { replace: true });
        return;
      }
      setCheckingAuth(false);
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!checkingAuth && anakId) {
      loadData(anakId);
    }
  }, [checkingAuth, anakId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [summaries, pertumbuhan, imunisasi, intervensi, profil] = await Promise.all([
        parentApi.getSummaries(),
        parentApi.getPertumbuhan(id),
        parentApi.getImunisasi(id),
        parentApi.getIntervensi(id),
        parentApi.getProfilAnak(id),
      ]);
      const selected = summaries.find((s: any) => s.anak.id === id) ?? null;
      setSummary(selected);
      setPertumbuhanList(pertumbuhan);
      setImunisasiList(imunisasi);
      setIntervensiList(intervensi);
      setProfilAnak(profil?.profilAnak ?? null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Gagal memuat profil anak",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const latestPertumbuhan = summary?.latestPertumbuhan ?? null;
  const reminderDate = summary?.reminder_kunjungan ?? null;
  const reminderTone = getReminderTone(reminderDate);
  const pertumbuhanYears = Array.from(
    new Set(pertumbuhanList.map((item: any) => new Date(item.tanggal_pengukuran).getFullYear().toString()))
  ).sort((a, b) => Number(b) - Number(a));
  const imunisasiYears = Array.from(
    new Set(imunisasiList.map((item: any) => new Date(item.tanggal).getFullYear().toString()))
  ).sort((a, b) => Number(b) - Number(a));

  const filteredPertumbuhan = pertumbuhanList.filter((item: any) => {
    const d = new Date(item.tanggal_pengukuran);
    const monthOk = monthPertumbuhan === "all" || d.getMonth() + 1 === Number(monthPertumbuhan);
    const yearOk = yearPertumbuhan === "all" || d.getFullYear().toString() === yearPertumbuhan;
    return monthOk && yearOk;
  });

  const filteredImunisasi = imunisasiList.filter((item: any) => {
    const d = new Date(item.tanggal);
    const monthOk = monthImunisasi === "all" || d.getMonth() + 1 === Number(monthImunisasi);
    const yearOk = yearImunisasi === "all" || d.getFullYear().toString() === yearImunisasi;
    return monthOk && yearOk;
  });

  const sortedPertumbuhan = [...filteredPertumbuhan].sort((a: any, b: any) => {
    const timeA = new Date(a.tanggal_pengukuran).getTime();
    const timeB = new Date(b.tanggal_pengukuran).getTime();
    return sortPertumbuhan === "newest" ? timeB - timeA : timeA - timeB;
  });
  const sortedImunisasi = [...filteredImunisasi].sort((a: any, b: any) => {
    const timeA = new Date(a.tanggal).getTime();
    const timeB = new Date(b.tanggal).getTime();
    return sortImunisasi === "newest" ? timeB - timeA : timeA - timeB;
  });
  const recentPertumbuhan = showAllPertumbuhan ? sortedPertumbuhan : sortedPertumbuhan.slice(0, 5);
  const recentImunisasi = showAllImunisasi ? sortedImunisasi : sortedImunisasi.slice(0, 5);

  const resetModalFields = () => {
    setCatatanMode("select");
    setTanggalPertumbuhan(new Date().toISOString().split("T")[0]);
    setBeratBadan("");
    setTinggiBadan("");
    setLilaCm("");
    setTanggalImunisasi(new Date().toISOString().split("T")[0]);
    setNamaImunisasi("");
    setKeteranganImunisasi("");
    setTanggalIntervensi(new Date().toISOString().split("T")[0]);
    setJenisIntervensi("PKMK");
    setProdukIntervensi("");
    setDosisIntervensi("");
    setCatatanIntervensi("");
  };

  const closeCatatanModal = () => {
    setShowCatatanModal(false);
    resetModalFields();
  };

  const handleSubmitPertumbuhan = async () => {
    if (!summary?.anak?.id) return;
    if (!beratBadan || !tinggiBadan || !tanggalPertumbuhan) {
      toast({ title: "Data belum lengkap", description: "Lengkapi semua field pemeriksaan.", variant: "destructive" });
      return;
    }
    try {
      setSavingCatatan(true);
      const fd = new FormData();
      fd.append("intent", "create-pertumbuhan");
      fd.append(
        "data",
        JSON.stringify({
          anak_id: summary.anak.id,
          tanggal_pengukuran: tanggalPertumbuhan,
          berat_badan: Number(beratBadan),
          tinggi_badan: Number(tinggiBadan),
          lila_cm: lilaCm ? Number(lilaCm) : null,
        })
      );
      await parentApi.submitAction(fd);
      toast({ title: "Berhasil", description: "Catatan pemeriksaan berhasil ditambahkan." });
      await loadData(summary.anak.id);
      closeCatatanModal();
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menyimpan", description: "Catatan pemeriksaan belum bisa disimpan.", variant: "destructive" });
    } finally {
      setSavingCatatan(false);
    }
  };

  const handleSubmitImunisasi = async () => {
    if (!summary?.anak?.id) return;
    if (!namaImunisasi.trim() || !tanggalImunisasi) {
      toast({ title: "Data belum lengkap", description: "Nama dan tanggal imunisasi wajib diisi.", variant: "destructive" });
      return;
    }
    try {
      setSavingCatatan(true);
      const fd = new FormData();
      fd.append("intent", "create-imunisasi");
      fd.append(
        "data",
        JSON.stringify({
          anak_id: summary.anak.id,
          tanggal: tanggalImunisasi,
          nama_imunisasi: namaImunisasi.trim(),
          keterangan: keteranganImunisasi.trim(),
        })
      );
      await parentApi.submitAction(fd);
      toast({ title: "Berhasil", description: "Catatan imunisasi berhasil ditambahkan." });
      await loadData(summary.anak.id);
      closeCatatanModal();
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menyimpan", description: "Catatan imunisasi belum bisa disimpan.", variant: "destructive" });
    } finally {
      setSavingCatatan(false);
    }
  };

  const handleSubmitIntervensi = async () => {
    if (!summary?.anak?.id) return;
    if (!tanggalIntervensi || !jenisIntervensi) {
      toast({ title: "Data belum lengkap", description: "Tanggal dan jenis intervensi wajib diisi.", variant: "destructive" });
      return;
    }
    try {
      setSavingCatatan(true);
      const fd = new FormData();
      fd.append("intent", "create-intervensi");
      fd.append(
        "data",
        JSON.stringify({
          anak_id: summary.anak.id,
          tanggal: tanggalIntervensi,
          jenis: jenisIntervensi,
          produk: produkIntervensi.trim(),
          dosis: dosisIntervensi.trim(),
          catatan: catatanIntervensi.trim(),
        })
      );
      await parentApi.submitAction(fd);
      toast({ title: "Berhasil", description: "Catatan intervensi gizi berhasil ditambahkan." });
      await loadData(summary.anak.id);
      closeCatatanModal();
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal menyimpan", description: "Catatan intervensi belum bisa disimpan.", variant: "destructive" });
    } finally {
      setSavingCatatan(false);
    }
  };
  const isMale = useMemo(() => {
    const jk = summary?.anak?.jenis_kelamin;
    return jk === "laki_laki" || jk === "L";
  }, [summary]);

  if (checkingAuth || loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <section className={styles.card}>
            <h2>Profil anak tidak ditemukan</h2>
            <Link to="/m/parent/dashboard" className={styles.primaryBtn}>
              Kembali ke Dashboard
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/m/parent/dashboard" className={styles.backButton}>
          <span className={styles.icon}>arrow_back</span>
        </Link>
        <div>
          <h1 className={styles.title}>{summary.anak.nama}</h1>
          <p className={styles.subtitle}>
            {isMale ? "Laki-laki" : "Perempuan"} • {calculateAge(summary.anak.tanggal_lahir)}
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Ringkasan</h3>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Catatan Pertumbuhan</span>
              <span className={styles.statValue}>{pertumbuhanList.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Catatan Imunisasi</span>
              <span className={styles.statValue}>{imunisasiList.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Intervensi Gizi</span>
              <span className={styles.statValue}>{intervensiList.length}</span>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Jadwal Kunjungan Kader</h3>
          {reminderDate ? (
            <div className={styles.detailList}>
              <p>
                <strong>Tanggal Kunjungan:</strong> {formatTanggalIndonesia(reminderDate)}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    reminderTone === "overdue"
                      ? styles.reminderDanger
                      : reminderTone === "today"
                        ? styles.reminderWarning
                        : styles.reminderInfo
                  }
                >
                  {reminderTone === "overdue" ? "Terlewat" : reminderTone === "today" ? "Hari ini" : "Akan datang"}
                </span>
              </p>
            </div>
          ) : (
            <p className={styles.muted}>Belum ada jadwal kunjungan dari kader.</p>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Ringkasan Profil Anak</h3>
          {profilAnak ? (
            <div className={styles.detailList}>
              <p>
                <strong>NIK Anak:</strong> {profilAnak.nik_anak || "-"}
              </p>
              <p>
                <strong>Tempat Lahir:</strong> {profilAnak.tempat_lahir || "-"}
              </p>
              <p>
                <strong>Panjang Lahir:</strong>{" "}
                {profilAnak.panjang_lahir_cm !== null && profilAnak.panjang_lahir_cm !== undefined
                  ? `${profilAnak.panjang_lahir_cm} cm`
                  : "-"}
              </p>
              <p>
                <strong>Berat Lahir:</strong>{" "}
                {profilAnak.berat_lahir_kg !== null && profilAnak.berat_lahir_kg !== undefined
                  ? `${profilAnak.berat_lahir_kg} kg`
                  : "-"}
              </p>
              <p>
                <strong>Golongan Darah:</strong> {profilAnak.golongan_darah || "-"}
              </p>
              <p>
                <strong>Alergi:</strong> {profilAnak.alergi || "-"}
              </p>
              <p>
                <strong>Catatan Kesehatan:</strong> {profilAnak.catatan_kesehatan || "-"}
              </p>
            </div>
          ) : (
            <p className={styles.muted}>Profil detail anak belum diisi.</p>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Status Gizi Terakhir</h3>
          {latestPertumbuhan ? (
            <div className={styles.detailList}>
              <p>
                <strong>BB/U:</strong> {toIndonesianNutritionStatus(latestPertumbuhan.kategori_bbu)}
              </p>
              <p>
                <strong>TB/U:</strong> {toIndonesianNutritionStatus(latestPertumbuhan.kategori_tbu)}
              </p>
              <p>
                <strong>BB/TB:</strong> {toIndonesianNutritionStatus(latestPertumbuhan.kategori_bbtb)}
              </p>
              <p>
                <strong>Pengukuran:</strong>{" "}
                {new Date(latestPertumbuhan.tanggal_pengukuran).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p>
                <strong>LiLA:</strong>{" "}
                {latestPertumbuhan.lila_cm !== null && latestPertumbuhan.lila_cm !== undefined
                  ? `${latestPertumbuhan.lila_cm} cm`
                  : "-"}
              </p>
            </div>
          ) : (
            <p className={styles.muted}>Belum ada data pertumbuhan.</p>
          )}
        </section>

        {summary.alerts && summary.alerts.length > 0 && (
          <section className={styles.card}>
            <h3 className={styles.sectionTitle}>Peringatan</h3>
            <ul className={styles.alertList}>
              {summary.alerts.map((alert: string, idx: number) => (
                <li key={idx}>{toIndonesianNutritionAlert(alert)}</li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Riwayat Pertumbuhan (5 Terakhir)</h3>
          <div className={styles.historyControls}>
            <div className={styles.filterRow}>
              <select className={styles.filterSelect} value={monthPertumbuhan} onChange={(e) => setMonthPertumbuhan(e.target.value)}>
                <option value="all">Semua Bulan</option>
                {monthOptions.map((monthName, i) => (
                  <option key={i + 1} value={i + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
              <select className={styles.filterSelect} value={yearPertumbuhan} onChange={(e) => setYearPertumbuhan(e.target.value)}>
                <option value="all">Semua Tahun</option>
                {pertumbuhanYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setSortPertumbuhan((prev) => (prev === "newest" ? "oldest" : "newest"))}
            >
              Urutkan: {sortPertumbuhan === "newest" ? "Terbaru" : "Terlama"}
            </button>
          </div>
          {recentPertumbuhan.length > 0 ? (
            <ul className={styles.historyList}>
              {recentPertumbuhan.map((item: any) => (
                <li key={item.id} className={styles.historyItem}>
                  <div>
                    <p className={styles.historyTitle}>
                      {formatTanggalIndonesia(item.tanggal_pengukuran)}
                    </p>
                    <p className={styles.historyMeta}>
                      BB {item.berat_badan} kg • TB {item.tinggi_badan} cm • LiLA{" "}
                      {item.lila_cm !== null && item.lila_cm !== undefined ? `${item.lila_cm} cm` : "-"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Belum ada riwayat pertumbuhan.</p>
          )}
          {sortedPertumbuhan.length > 5 && (
            <button type="button" className={styles.linkBtn} onClick={() => setShowAllPertumbuhan((v) => !v)}>
              {showAllPertumbuhan ? "Tampilkan lebih sedikit" : "Lihat semua riwayat"}
            </button>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Riwayat Imunisasi (5 Terakhir)</h3>
          <div className={styles.historyControls}>
            <div className={styles.filterRow}>
              <select className={styles.filterSelect} value={monthImunisasi} onChange={(e) => setMonthImunisasi(e.target.value)}>
                <option value="all">Semua Bulan</option>
                {monthOptions.map((monthName, i) => (
                  <option key={i + 1} value={i + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
              <select className={styles.filterSelect} value={yearImunisasi} onChange={(e) => setYearImunisasi(e.target.value)}>
                <option value="all">Semua Tahun</option>
                {imunisasiYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setSortImunisasi((prev) => (prev === "newest" ? "oldest" : "newest"))}
            >
              Urutkan: {sortImunisasi === "newest" ? "Terbaru" : "Terlama"}
            </button>
          </div>
          {recentImunisasi.length > 0 ? (
            <ul className={styles.historyList}>
              {recentImunisasi.map((item: any) => (
                <li key={item.id} className={styles.historyItem}>
                  <div>
                    <p className={styles.historyTitle}>
                      {item.nama_vaksin} - {formatTanggalIndonesia(item.tanggal)}
                    </p>
                    <p className={styles.historyMeta}>{item.keterangan || "Tanpa keterangan"}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Belum ada riwayat imunisasi.</p>
          )}
          {sortedImunisasi.length > 5 && (
            <button type="button" className={styles.linkBtn} onClick={() => setShowAllImunisasi((v) => !v)}>
              {showAllImunisasi ? "Tampilkan lebih sedikit" : "Lihat semua riwayat"}
            </button>
          )}
        </section>

        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Riwayat Intervensi Gizi</h3>
          {intervensiList.length > 0 ? (
            <ul className={styles.historyList}>
              {intervensiList.slice(0, 5).map((item: any) => (
                <li key={item.id} className={styles.historyItem}>
                  <div>
                    <p className={styles.historyTitle}>
                      {item.jenis} - {formatTanggalIndonesia(item.tanggal)}
                    </p>
                    <p className={styles.historyMeta}>
                      Produk: {item.produk || "-"} • Dosis: {item.dosis || "-"} • Catatan: {item.catatan || "-"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>Belum ada riwayat intervensi gizi.</p>
          )}
        </section>

        <section className={styles.actionRow}>
          <Link to={`/m/parent/anak/${summary.anak.id}/profil`} className={styles.secondaryBtn}>
            Edit Profil Anak
          </Link>
          <button className={styles.primaryBtn} type="button" onClick={() => setShowCatatanModal(true)}>
            Tambah Catatan
          </button>
          <Link to="/m/parent/dashboard" className={styles.secondaryBtn}>
            Kembali
          </Link>
        </section>
      </main>
      {showCatatanModal && (
        <div className={styles.modalBackdrop} onClick={closeCatatanModal}>
          <section className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.sectionTitle}>Tambah Catatan</h3>
              <button type="button" className={styles.modalClose} onClick={closeCatatanModal}>
                ✕
              </button>
            </div>
            {catatanMode === "select" && (
              <div className={styles.optionGrid}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setCatatanMode("pertumbuhan")}>
                  Pemeriksaan BB & TB
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={() => setCatatanMode("imunisasi")}>
                  Imunisasi
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={() => setCatatanMode("intervensi")}>
                  PKMK / Vitamin / Zinc
                </button>
              </div>
            )}
            {catatanMode === "pertumbuhan" && (
              <div className={styles.modalForm}>
                <label className={styles.formLabel}>Tanggal Pengukuran</label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={tanggalPertumbuhan}
                  onChange={(e) => setTanggalPertumbuhan(e.target.value)}
                />
                <label className={styles.formLabel}>Berat Badan (kg)</label>
                <input
                  className={styles.formInput}
                  type="number"
                  step="0.01"
                  value={beratBadan}
                  onChange={(e) => setBeratBadan(e.target.value)}
                />
                <label className={styles.formLabel}>Tinggi Badan (cm)</label>
                <input
                  className={styles.formInput}
                  type="number"
                  step="0.01"
                  value={tinggiBadan}
                  onChange={(e) => setTinggiBadan(e.target.value)}
                />
                <label className={styles.formLabel}>LiLA (cm) - Opsional</label>
                <input
                  className={styles.formInput}
                  type="number"
                  step="0.01"
                  min="1"
                  value={lilaCm}
                  onChange={(e) => setLilaCm(e.target.value)}
                />
                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setCatatanMode("select")}>
                    Kembali
                  </button>
                  <button type="button" className={styles.primaryBtn} onClick={handleSubmitPertumbuhan} disabled={savingCatatan}>
                    {savingCatatan ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            )}
            {catatanMode === "imunisasi" && (
              <div className={styles.modalForm}>
                <label className={styles.formLabel}>Nama Imunisasi</label>
                <input className={styles.formInput} value={namaImunisasi} onChange={(e) => setNamaImunisasi(e.target.value)} />
                <label className={styles.formLabel}>Tanggal Imunisasi</label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={tanggalImunisasi}
                  onChange={(e) => setTanggalImunisasi(e.target.value)}
                />
                <label className={styles.formLabel}>Keterangan</label>
                <input
                  className={styles.formInput}
                  value={keteranganImunisasi}
                  onChange={(e) => setKeteranganImunisasi(e.target.value)}
                />
                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setCatatanMode("select")}>
                    Kembali
                  </button>
                  <button type="button" className={styles.primaryBtn} onClick={handleSubmitImunisasi} disabled={savingCatatan}>
                    {savingCatatan ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            )}
            {catatanMode === "intervensi" && (
              <div className={styles.modalForm}>
                <label className={styles.formLabel}>Tanggal</label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={tanggalIntervensi}
                  onChange={(e) => setTanggalIntervensi(e.target.value)}
                />
                <label className={styles.formLabel}>Jenis Intervensi</label>
                <select
                  className={styles.formInput}
                  value={jenisIntervensi}
                  onChange={(e) => setJenisIntervensi(e.target.value as "PKMK" | "VITAMIN" | "ZINC")}
                >
                  <option value="PKMK">PKMK</option>
                  <option value="VITAMIN">Vitamin</option>
                  <option value="ZINC">Zinc</option>
                </select>
                <label className={styles.formLabel}>Produk</label>
                <input
                  className={styles.formInput}
                  value={produkIntervensi}
                  onChange={(e) => setProdukIntervensi(e.target.value)}
                  placeholder="Opsional"
                />
                <label className={styles.formLabel}>Dosis</label>
                <input
                  className={styles.formInput}
                  value={dosisIntervensi}
                  onChange={(e) => setDosisIntervensi(e.target.value)}
                  placeholder="Opsional"
                />
                <label className={styles.formLabel}>Catatan</label>
                <input
                  className={styles.formInput}
                  value={catatanIntervensi}
                  onChange={(e) => setCatatanIntervensi(e.target.value)}
                  placeholder="Opsional"
                />
                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setCatatanMode("select")}>
                    Kembali
                  </button>
                  <button type="button" className={styles.primaryBtn} onClick={handleSubmitIntervensi} disabled={savingCatatan}>
                    {savingCatatan ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      <MobileParentNav />
    </div>
  );
}
