import { Building2, Users, AlertTriangle, Activity, TrendingUp, FileCheck } from "lucide-react";
import styles from "./puskesmas-stats.module.css";
import type { PuskesmasStats } from "~/db/services/puskesmas.service";

interface PuskesmasStatsProps {
  stats: PuskesmasStats;
}

export function PuskesmasStatsComponent({ stats }: PuskesmasStatsProps) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statIconWrapper}>
          <Users className={styles.statIcon} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Total Balita</span>
          <span className={styles.statValue}>{stats.totalBalita}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIconWrapper}>
          <Building2 className={styles.statIcon} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Wilayah Kerja</span>
          <span className={styles.statValue}>{stats.totalWilayah}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIconWrapper}>
          <Activity className={styles.statIcon} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Total Kader</span>
          <span className={styles.statValue}>{stats.totalKader}</span>
        </div>
      </div>

      <div className={`${styles.statCard} ${stats.stuntingCount > 0 ? styles.alertCard : ""}`}>
        <div className={styles.statIconWrapper}>
          <AlertTriangle className={styles.statIcon} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Kasus Stunting (&lt; -2 SD)</span>
          <span className={styles.statValue}>{stats.stuntingCount}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIconWrapper}>
          <TrendingUp className={styles.statIcon} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Prevalensi Stunting</span>
          <span className={styles.statValue}>{stats.prevalensiStunting.toFixed(1)}%</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIconWrapper}>
          <FileCheck className={styles.statIcon} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Cakupan Pemeriksaan</span>
          <span className={styles.statValue}>{stats.cakupanPemeriksaan.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
