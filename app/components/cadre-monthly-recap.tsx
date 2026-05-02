import { FileText, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import type { MonthlyStats } from "~/db/services/cadre.service";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card/card";
import { Badge } from "./ui/badge/badge";
import styles from "./cadre-monthly-recap.module.css";

interface CadreMonthlyRecapProps {
  recaps: MonthlyStats[];
}

export function CadreMonthlyRecap({ recaps }: CadreMonthlyRecapProps) {
  if (recaps.length === 0) {
    return (
      <div className={styles.empty}>
        <FileText size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>Belum ada data rekap bulanan</p>
      </div>
    );
  }

  // Latest recap (current month)
  const latestRecap = recaps[0];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <FileText className={styles.titleIcon} />
          <h2 className={styles.title}>Rekap Data Bulanan</h2>
        </div>
      </div>

      {/* Current Month Summary */}
      <Card className={styles.currentMonthCard}>
        <CardHeader>
          <div className={styles.currentMonthHeader}>
            <div>
              <CardTitle>
                {latestRecap.month} {latestRecap.year}
              </CardTitle>
              <p className={styles.currentMonthSubtitle}>Rekap Bulan Ini</p>
            </div>
            <Badge variant="default" className={styles.currentBadge}>
              Terbaru
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Anak</span>
              <span className={styles.statValue}>{latestRecap.total_anak}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Pemeriksaan</span>
              <span className={styles.statValue}>{latestRecap.total_pemeriksaan}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Normal</span>
              <span className={styles.statValueSuccess}>{latestRecap.normal_count}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Stunted</span>
              <span className={styles.statValueWarning}>
                {latestRecap.stunted_count + latestRecap.severely_stunted_count}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Stunted (Ringan):</span>
              <span className={styles.detailValue}>{latestRecap.stunted_count}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Stunted (Berat):</span>
              <span className={styles.detailValue}>{latestRecap.severely_stunted_count}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Underweight:</span>
              <span className={styles.detailValue}>{latestRecap.underweight_count}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Wasted:</span>
              <span className={styles.detailValue}>{latestRecap.wasted_count}</span>
            </div>
          </div>

          {(latestRecap.stunted_count > 0 ||
            latestRecap.severely_stunted_count > 0 ||
            latestRecap.underweight_count > 0 ||
            latestRecap.wasted_count > 0) && (
            <div className={styles.alert}>
              <AlertCircle size={18} />
              <span>
                Ada {latestRecap.stunted_count + latestRecap.severely_stunted_count} anak dengan
                indikasi stunting
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Recaps */}
      {recaps.length > 1 && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>
            <Calendar size={20} />
            Riwayat 6 Bulan Terakhir
          </h3>
          <div className={styles.historyGrid}>
            {recaps.map((recap, index) => (
              <Card key={`${recap.year}-${recap.month}`} className={styles.historyCard}>
                <CardHeader className={styles.historyCardHeader}>
                  <CardTitle className={styles.historyCardTitle}>
                    {recap.month} {recap.year}
                  </CardTitle>
                  {index === 0 && (
                    <Badge variant="secondary" className={styles.historyBadge}>
                      Terbaru
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className={styles.historyCardContent}>
                  <div className={styles.historyStats}>
                    <div className={styles.historyStat}>
                      <span className={styles.historyStatLabel}>Anak</span>
                      <span className={styles.historyStatValue}>{recap.total_anak}</span>
                    </div>
                    <div className={styles.historyStat}>
                      <span className={styles.historyStatLabel}>Pemeriksaan</span>
                      <span className={styles.historyStatValue}>{recap.total_pemeriksaan}</span>
                    </div>
                  </div>
                  <div className={styles.historyDetails}>
                    <div className={styles.historyDetailRow}>
                      <span className={styles.historyDetailLabel}>Normal:</span>
                      <Badge variant="secondary" className={styles.historyDetailBadge}>
                        {recap.normal_count}
                      </Badge>
                    </div>
                    <div className={styles.historyDetailRow}>
                      <span className={styles.historyDetailLabel}>Stunted:</span>
                      <Badge
                        variant={
                          recap.stunted_count + recap.severely_stunted_count > 0
                            ? "destructive"
                            : "secondary"
                        }
                        className={styles.historyDetailBadge}
                      >
                        {recap.stunted_count + recap.severely_stunted_count}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
