import { Activity, AlertTriangle, Baby, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card/card";
import { Badge } from "~/components/ui/badge/badge";
import type { DashboardStats, AnakSummary } from "~/db/services/dashboard.service";
import { toIndonesianNutritionAlert, toIndonesianNutritionStatus } from "~/utils/nutrition-status";
import styles from "./parent-dashboard-summary.module.css";

interface ParentDashboardSummaryProps {
  stats: DashboardStats;
  anakSummaries: AnakSummary[];
  onSelectAnak: (anakId: string) => void;
}

export function ParentDashboardSummary({ stats, anakSummaries, onSelectAnak }: ParentDashboardSummaryProps) {
  return (
    <div className={styles.container}>
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Baby className={styles.statIcon} />
              <span>Total Anak</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.totalAnak}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Activity className={styles.statIcon} />
              <span>Data Terkini</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.anakWithLatestData}</div>
            <div className={styles.statSubtext}>dari {stats.totalAnak} anak</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <AlertTriangle className={styles.statIcon} />
              <span>Perlu Perhatian</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue} data-warning={stats.anakNeedAttention > 0}>
              {stats.anakNeedAttention}
            </div>
            <div className={styles.statSubtext}>Z-Score &lt; -2 SD</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Calendar className={styles.statIcon} />
              <span>Update Terakhir</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statDate}>
              {stats.lastUpdateDate ? new Date(stats.lastUpdateDate).toLocaleDateString("id-ID") : "Belum ada data"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anak Summaries */}
      {anakSummaries.length > 0 && (
        <div className={styles.summaries}>
          <h2 className={styles.summariesTitle}>Ringkasan Data Anak</h2>
          <div className={styles.summariesGrid}>
            {anakSummaries.map((summary) => (
              <Card key={summary.anak.id} className={styles.summaryCard} onClick={() => onSelectAnak(summary.anak.id)}>
                <CardHeader>
                  <div className={styles.summaryHeader}>
                    <CardTitle className={styles.summaryName}>{summary.anak.nama}</CardTitle>
                    {summary.needsAttention && (
                      <Badge variant="destructive" className={styles.alertBadge}>
                        <AlertTriangle className={styles.alertIcon} />
                        Perhatian
                      </Badge>
                    )}
                  </div>
                  <div className={styles.summaryMeta}>
                    {summary.anak.jenis_kelamin} • {calculateAge(summary.anak.tanggal_lahir)}
                  </div>
                </CardHeader>
                <CardContent>
                  {summary.latestPertumbuhan ? (
                    <div className={styles.summaryData}>
                      <div className={styles.measurementRow}>
                        <span className={styles.measurementLabel}>Berat Badan:</span>
                        <span className={styles.measurementValue}>{summary.latestPertumbuhan.berat_badan} kg</span>
                      </div>
                      <div className={styles.measurementRow}>
                        <span className={styles.measurementLabel}>Tinggi Badan:</span>
                        <span className={styles.measurementValue}>{summary.latestPertumbuhan.tinggi_badan} cm</span>
                      </div>

                      {/* Z-Scores */}
                      <div className={styles.zscores}>
                        {summary.latestPertumbuhan.zscore_tbu !== null && (
                          <div className={styles.zscore}>
                            <span className={styles.zscoreLabel}>TB/U:</span>
                            <Badge variant={getZScoreBadgeVariant(summary.latestPertumbuhan.zscore_tbu)}>
                              {summary.latestPertumbuhan.zscore_tbu.toFixed(2)} SD
                            </Badge>
                            <span className={styles.zscoreCategory}>
                              {toIndonesianNutritionStatus(summary.latestPertumbuhan.kategori_tbu)}
                            </span>
                          </div>
                        )}
                        {summary.latestPertumbuhan.zscore_bbu !== null && (
                          <div className={styles.zscore}>
                            <span className={styles.zscoreLabel}>BB/U:</span>
                            <Badge variant={getZScoreBadgeVariant(summary.latestPertumbuhan.zscore_bbu)}>
                              {summary.latestPertumbuhan.zscore_bbu.toFixed(2)} SD
                            </Badge>
                            <span className={styles.zscoreCategory}>
                              {toIndonesianNutritionStatus(summary.latestPertumbuhan.kategori_bbu)}
                            </span>
                          </div>
                        )}
                        {summary.latestPertumbuhan.zscore_bbtb !== null && (
                          <div className={styles.zscore}>
                            <span className={styles.zscoreLabel}>BB/TB:</span>
                            <Badge variant={getZScoreBadgeVariant(summary.latestPertumbuhan.zscore_bbtb)}>
                              {summary.latestPertumbuhan.zscore_bbtb.toFixed(2)} SD
                            </Badge>
                            <span className={styles.zscoreCategory}>
                              {toIndonesianNutritionStatus(summary.latestPertumbuhan.kategori_bbtb)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Alerts */}
                      {summary.alerts.length > 0 && (
                        <div className={styles.alerts}>
                          {summary.alerts.map((alert, idx) => (
                            <div key={idx} className={styles.alert}>
                              <AlertTriangle className={styles.alertIconSmall} />
                              {toIndonesianNutritionAlert(alert)}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.recordCount}>{summary.pertumbuhanCount} catatan pertumbuhan</div>
                    </div>
                  ) : (
                    <div className={styles.noData}>Belum ada data pertumbuhan</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function calculateAge(tanggalLahir: string): string {
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));

  if (diffMonths < 12) {
    return `${diffMonths} bulan`;
  }

  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  return months > 0 ? `${years} tahun ${months} bulan` : `${years} tahun`;
}

function getZScoreBadgeVariant(zscore: number): "default" | "secondary" | "destructive" {
  if (zscore < -3) return "destructive";
  if (zscore < -2) return "secondary";
  return "default";
}
