import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./+types/puskesmas.anak.$anakId";
import { DashboardLayout } from "~/components/dashboard-layout";
import { Button } from "~/components/ui/button/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs/tabs";
import { getCurrentUser } from "~/utils/auth";
import { toIndonesianNutritionStatus } from "~/utils/nutrition-status";
import styles from "./puskesmas.anak.$anakId.module.css";

type AnakDetail = {
  anak: {
    id: string;
    nama: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    parent_name: string | null;
    wilayah_name: string | null;
  };
  profilAnak: any | null;
  pertumbuhan: any[];
  imunisasi: any[];
  intervensi: any[];
};

const api = {
  fetchWithError: async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${r.status}`);
    }
    return r.json();
  },
  getDetail: (anakId: string) =>
    api.fetchWithError(`/api/puskesmas/dashboard?action=anak-detail&anakId=${encodeURIComponent(anakId)}`),
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function calculateAge(tanggalLahir: string) {
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  const diffMonths = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (diffMonths < 12) return `${diffMonths} bulan`;
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  return months > 0 ? `${years} thn ${months} bln` : `${years} tahun`;
}

function formatZscoreValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function ZscoreRow({ label, score, category }: { label: string; score: unknown; category: unknown }) {
  const desc = toIndonesianNutritionStatus(typeof category === "string" ? category : null);
  return (
    <div className={styles.zscoreLine}>
      <span className={styles.zscoreLabel}>{label}</span>
      <span className={styles.zscoreValue}>{formatZscoreValue(score)}</span>
      <span className={styles.zscoreDesc}>{desc}</span>
    </div>
  );
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Detail Anak - Desktop Puskesmas" }];
}

export default function PuskesmasAnakDetailPage() {
  const navigate = useNavigate();
  const { anakId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnakDetail | null>(null);

  const latestPertumbuhan = useMemo(() => detail?.pertumbuhan?.[0] ?? null, [detail]);

  const loadDetail = async () => {
    if (!anakId) return;
    try {
      setLoading(true);
      setLoadError(null);
      const data = await api.getDetail(anakId);
      setDetail(data);
    } catch (error) {
      console.error(error);
      setLoadError("Gagal memuat profil anak.");
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
      loadDetail();
    });
    return () => {
      mounted = false;
    };
  }, [anakId, navigate]);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <section className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <Link className={styles.backLink} to="/puskesmas/anak">
              <ArrowLeft className={styles.backIcon} />
              Kembali ke Data Anak
            </Link>
            <h1 className={styles.title}>Profil Pemeriksaan Anak</h1>
          </div>
          <Button variant="outline" onClick={loadDetail} disabled={loading}>
            Refresh
          </Button>
        </section>

        {loading && !detail ? <section className={styles.card}><p className={styles.emptyText}>Memuat data...</p></section> : null}
        {!loading && loadError && !detail ? <section className={styles.card}><p className={styles.emptyText}>{loadError}</p></section> : null}

        {detail ? (
          <>
            <section className={styles.card}>
              <div className={styles.identityGrid}>
                <div>
                  <p className={styles.itemLabel}>Nama Anak</p>
                  <p className={styles.itemValue}>{detail.anak.nama}</p>
                </div>
                <div>
                  <p className={styles.itemLabel}>Usia</p>
                  <p className={styles.itemValue}>{calculateAge(detail.anak.tanggal_lahir)}</p>
                </div>
                <div>
                  <p className={styles.itemLabel}>Jenis Kelamin</p>
                  <p className={styles.itemValue}>{detail.anak.jenis_kelamin === "laki_laki" ? "Laki-laki" : "Perempuan"}</p>
                </div>
                <div>
                  <p className={styles.itemLabel}>Orang Tua / Wilayah</p>
                  <p className={styles.itemValue}>{detail.anak.parent_name || "-"} / {detail.anak.wilayah_name || "-"}</p>
                </div>
                <div>
                  <p className={styles.itemLabel}>Pemeriksaan Terakhir</p>
                  <p className={styles.itemValue}>{latestPertumbuhan ? formatDate(latestPertumbuhan.tanggal_pengukuran) : "Belum ada"}</p>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <Tabs defaultValue="profil">
                <TabsList className={styles.tabsList}>
                  <TabsTrigger value="profil">Profil Kesehatan</TabsTrigger>
                  <TabsTrigger value="pertumbuhan">Pertumbuhan</TabsTrigger>
                  <TabsTrigger value="imunisasi">Imunisasi</TabsTrigger>
                  <TabsTrigger value="intervensi">Intervensi Gizi</TabsTrigger>
                </TabsList>

                <TabsContent value="profil" className={styles.tabContent}>
                  {!detail.profilAnak ? (
                    <p className={styles.emptyText}>Profil anak belum diisi.</p>
                  ) : (
                    <div className={styles.identityGrid}>
                      <div><p className={styles.itemLabel}>NIK Anak</p><p className={styles.itemValue}>{detail.profilAnak.nik_anak || "-"}</p></div>
                      <div><p className={styles.itemLabel}>Tempat Lahir</p><p className={styles.itemValue}>{detail.profilAnak.tempat_lahir || "-"}</p></div>
                      <div><p className={styles.itemLabel}>Panjang Lahir</p><p className={styles.itemValue}>{detail.profilAnak.panjang_lahir_cm ?? "-"} cm</p></div>
                      <div><p className={styles.itemLabel}>Berat Lahir</p><p className={styles.itemValue}>{detail.profilAnak.berat_lahir_kg ?? "-"} kg</p></div>
                      <div><p className={styles.itemLabel}>Golongan Darah</p><p className={styles.itemValue}>{detail.profilAnak.golongan_darah || "-"}</p></div>
                      <div><p className={styles.itemLabel}>Alergi</p><p className={styles.itemValue}>{detail.profilAnak.alergi || "-"}</p></div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pertumbuhan" className={styles.tabContent}>
                  {detail.pertumbuhan.length === 0 ? <p className={styles.emptyText}>Belum ada data pertumbuhan.</p> : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead><tr><th>Tanggal</th><th>BB/TB</th><th>LiLA</th><th>Z-Score</th></tr></thead>
                        <tbody>
                          {detail.pertumbuhan.map((item) => (
                            <tr key={item.id}>
                              <td>{formatDate(item.tanggal_pengukuran)}</td>
                              <td>{item.berat_badan} kg / {item.tinggi_badan} cm</td>
                              <td>{item.lila_cm ?? "-"}</td>
                              <td>
                                <div className={styles.zscoreCell}>
                                  <ZscoreRow label="TB/U" score={item.zscore_tbu} category={item.kategori_tbu} />
                                  <ZscoreRow label="BB/U" score={item.zscore_bbu} category={item.kategori_bbu} />
                                  <ZscoreRow label="BB/TB" score={item.zscore_bbtb} category={item.kategori_bbtb} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="imunisasi" className={styles.tabContent}>
                  {detail.imunisasi.length === 0 ? <p className={styles.emptyText}>Belum ada data imunisasi.</p> : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead><tr><th>Tanggal</th><th>Jenis Imunisasi</th><th>Catatan</th></tr></thead>
                        <tbody>
                          {detail.imunisasi.map((item) => (
                            <tr key={item.id}>
                              <td>{formatDate(item.tanggal_pemberian)}</td>
                              <td>{item.jenis_imunisasi}</td>
                              <td>{item.catatan || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="intervensi" className={styles.tabContent}>
                  {detail.intervensi.length === 0 ? <p className={styles.emptyText}>Belum ada data intervensi gizi.</p> : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead><tr><th>Tanggal</th><th>Jenis</th><th>Produk/Dosis</th><th>Catatan</th></tr></thead>
                        <tbody>
                          {detail.intervensi.map((item) => (
                            <tr key={item.id}>
                              <td>{formatDate(item.tanggal)}</td>
                              <td>{item.jenis}</td>
                              <td>{item.produk || "-"} / {item.dosis || "-"}</td>
                              <td>{item.catatan || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
