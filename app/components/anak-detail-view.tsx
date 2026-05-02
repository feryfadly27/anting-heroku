import { useState } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Scale, Ruler, Syringe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "./ui/card/card";
import { Button } from "./ui/button/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs/tabs";
import type { Database } from "~/db/types";
import { toIndonesianNutritionStatus } from "~/utils/nutrition-status";
import styles from "./anak-detail-view.module.css";

type AnakRow = Database["public"]["Tables"]["anak"]["Row"];
type PertumbuhanRow = Database["public"]["Tables"]["pertumbuhan"]["Row"];
type ImunisasiRow = Database["public"]["Tables"]["imunisasi"]["Row"];

interface AnakDetailViewProps {
  anak: AnakRow;
  pertumbuhanList: PertumbuhanRow[];
  imunisasiList: ImunisasiRow[];
  onBack: () => void;
  onAddPertumbuhan: () => void;
  onEditPertumbuhan: (pertumbuhan: PertumbuhanRow) => void;
  onDeletePertumbuhan: (id: string) => void;
  onAddImunisasi: () => void;
  onEditImunisasi: (imunisasi: ImunisasiRow) => void;
  onDeleteImunisasi: (id: string) => void;
}

export function AnakDetailView({
  anak,
  pertumbuhanList,
  imunisasiList,
  onBack,
  onAddPertumbuhan,
  onEditPertumbuhan,
  onDeletePertumbuhan,
  onAddImunisasi,
  onEditImunisasi,
  onDeleteImunisasi,
}: AnakDetailViewProps) {
  const calculateAge = (tanggalLahir: string) => {
    const today = new Date();
    const birthDate = new Date(tanggalLahir);
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());

    if (months < 12) {
      return `${months} bulan`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years} tahun ${remainingMonths} bulan` : `${years} tahun`;
  };

  const getZScoreClass = (zscore: number, type: string) => {
    if (type === "tbu") {
      if (zscore >= -2) return styles.zscoreNormal;
      if (zscore >= -3) return styles.zscoreWarning;
      return styles.zscoreDanger;
    }
    if (type === "bbu") {
      if (zscore >= -2) return styles.zscoreNormal;
      if (zscore >= -3) return styles.zscoreWarning;
      return styles.zscoreDanger;
    }
    if (type === "bbtb") {
      if (zscore >= -2 && zscore <= 2) return styles.zscoreNormal;
      if ((zscore >= -3 && zscore < -2) || zscore > 2) return styles.zscoreWarning;
      return styles.zscoreDanger;
    }
    return "";
  };

  const getZScoreIcon = (zscore: number, type: string) => {
    if (type === "tbu" || type === "bbu") {
      if (zscore >= -2) return <TrendingUp size={14} />;
      if (zscore >= -3) return <Minus size={14} />;
      return <TrendingDown size={14} />;
    }
    if (type === "bbtb") {
      if (zscore >= -2 && zscore <= 2) return <Minus size={14} />;
      if (zscore > 2) return <TrendingUp size={14} />;
      return <TrendingDown size={14} />;
    }
    return <Minus size={14} />;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} />
          Kembali
        </Button>
      </div>

      <Card className={styles.profileCard}>
        <h2 className={styles.name}>{anak.nama}</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Jenis Kelamin</span>
            <span className={styles.infoValue}>{anak.jenis_kelamin}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tanggal Lahir</span>
            <span className={styles.infoValue}>
              {new Date(anak.tanggal_lahir).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Umur</span>
            <span className={styles.infoValue}>{calculateAge(anak.tanggal_lahir)}</span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="pertumbuhan" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="pertumbuhan">
            <Scale size={16} />
            Pertumbuhan
          </TabsTrigger>
          <TabsTrigger value="imunisasi">
            <Syringe size={16} />
            Imunisasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pertumbuhan">
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <h3 className={styles.tabTitle}>Riwayat Pertumbuhan</h3>
              <Button onClick={onAddPertumbuhan}>
                <Plus size={16} />
                Tambah Data
              </Button>
            </div>

            {pertumbuhanList.length === 0 ? (
              <Card className={styles.emptyState}>
                <Scale size={48} className={styles.emptyIcon} />
                <p className={styles.emptyText}>Belum ada data pertumbuhan</p>
              </Card>
            ) : (
              <div className={styles.recordList}>
                {pertumbuhanList.map((item) => (
                  <Card key={item.id} className={styles.recordCard}>
                    <div className={styles.recordHeader}>
                      <span className={styles.recordDate}>
                        {new Date(item.tanggal_pengukuran).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <div className={styles.recordActions}>
                        <button onClick={() => onEditPertumbuhan(item)} className={styles.actionBtn}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => onDeletePertumbuhan(item.id)} className={styles.actionBtnDanger}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.recordData}>
                      <div className={styles.dataItem}>
                        <Scale size={20} className={styles.dataIcon} />
                        <div className={styles.dataContent}>
                          <span className={styles.dataLabel}>Berat Badan</span>
                          <span className={styles.dataValue}>{item.berat_badan} kg</span>
                        </div>
                      </div>
                      <div className={styles.dataItem}>
                        <Ruler size={20} className={styles.dataIcon} />
                        <div className={styles.dataContent}>
                          <span className={styles.dataLabel}>Tinggi Badan</span>
                          <span className={styles.dataValue}>{item.tinggi_badan} cm</span>
                        </div>
                      </div>
                      {item.umur_bulan !== null && (
                        <div className={styles.dataItem}>
                          <div className={styles.dataContent}>
                            <span className={styles.dataLabel}>Umur Saat Ukur</span>
                            <span className={styles.dataValue}>{item.umur_bulan} bulan</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Z-Score Section */}
                    {(item.zscore_tbu !== null || item.zscore_bbu !== null || item.zscore_bbtb !== null) && (
                      <div className={styles.zscoreSection}>
                        <h4 className={styles.zscoreTitle}>Hasil Analisis WHO</h4>
                        <div className={styles.zscoreGrid}>
                          {item.zscore_tbu !== null && (
                            <div className={styles.zscoreCard}>
                              <div className={styles.zscoreHeader}>
                                <span className={styles.zscoreLabel}>TB/U (Tinggi per Umur)</span>
                                <span className={styles.zscoreValue}>{item.zscore_tbu.toFixed(2)} SD</span>
                              </div>
                              <div className={`${styles.zscoreBadge} ${getZScoreClass(item.zscore_tbu, "tbu")}`}>
                                {getZScoreIcon(item.zscore_tbu, "tbu")}
                                <span>{toIndonesianNutritionStatus(item.kategori_tbu)}</span>
                              </div>
                            </div>
                          )}
                          {item.zscore_bbu !== null && (
                            <div className={styles.zscoreCard}>
                              <div className={styles.zscoreHeader}>
                                <span className={styles.zscoreLabel}>BB/U (Berat per Umur)</span>
                                <span className={styles.zscoreValue}>{item.zscore_bbu.toFixed(2)} SD</span>
                              </div>
                              <div className={`${styles.zscoreBadge} ${getZScoreClass(item.zscore_bbu, "bbu")}`}>
                                {getZScoreIcon(item.zscore_bbu, "bbu")}
                                <span>{toIndonesianNutritionStatus(item.kategori_bbu)}</span>
                              </div>
                            </div>
                          )}
                          {item.zscore_bbtb !== null && (
                            <div className={styles.zscoreCard}>
                              <div className={styles.zscoreHeader}>
                                <span className={styles.zscoreLabel}>BB/TB (Berat per Tinggi)</span>
                                <span className={styles.zscoreValue}>{item.zscore_bbtb.toFixed(2)} SD</span>
                              </div>
                              <div className={`${styles.zscoreBadge} ${getZScoreClass(item.zscore_bbtb, "bbtb")}`}>
                                {getZScoreIcon(item.zscore_bbtb, "bbtb")}
                                <span>{toIndonesianNutritionStatus(item.kategori_bbtb)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="imunisasi">
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <h3 className={styles.tabTitle}>Riwayat Imunisasi</h3>
              <Button onClick={onAddImunisasi}>
                <Plus size={16} />
                Tambah Data
              </Button>
            </div>

            {imunisasiList.length === 0 ? (
              <Card className={styles.emptyState}>
                <Syringe size={48} className={styles.emptyIcon} />
                <p className={styles.emptyText}>Belum ada data imunisasi</p>
              </Card>
            ) : (
              <div className={styles.recordList}>
                {imunisasiList.map((item) => (
                  <Card key={item.id} className={styles.recordCard}>
                    <div className={styles.recordHeader}>
                      <span className={styles.recordDate}>
                        {new Date(item.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <div className={styles.recordActions}>
                        <button onClick={() => onEditImunisasi(item)} className={styles.actionBtn}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => onDeleteImunisasi(item.id)} className={styles.actionBtnDanger}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.recordData}>
                      <div className={styles.dataItem}>
                        <Syringe size={20} className={styles.dataIcon} />
                        <div className={styles.dataContent}>
                          <span className={styles.dataLabel}>Jenis Imunisasi</span>
                          <span className={styles.dataValue}>{item.nama_imunisasi}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
