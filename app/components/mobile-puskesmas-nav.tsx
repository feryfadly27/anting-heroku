import { Link, useLocation } from "react-router";
import styles from "./mobile-puskesmas-nav.module.css";

export function MobilePuskesmasNav() {
  const path = useLocation().pathname;
  const isHome = path === "/m/puskesmas/dashboard";
  const isAnak = path === "/m/puskesmas/anak";
  const isWilayah = path === "/m/puskesmas/wilayah";
  const isKader = path === "/m/puskesmas/kader";
  const isInformasi = path === "/m/puskesmas/informasi";

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navInner}>
        <Link className={isHome ? styles.navItemActive : styles.navItem} to="/m/puskesmas/dashboard">
          <span className={styles.iconFilled}>home</span>
          <span>Beranda</span>
        </Link>
        <Link className={isAnak ? styles.navItemActive : styles.navItem} to="/m/puskesmas/anak">
          <span className={styles.icon}>child_care</span>
          <span>Anak</span>
        </Link>
        <Link className={isWilayah ? styles.navItemActive : styles.navItem} to="/m/puskesmas/wilayah">
          <span className={styles.icon}>map</span>
          <span>Wilayah</span>
        </Link>
        <Link className={isKader ? styles.navItemActive : styles.navItem} to="/m/puskesmas/kader">
          <span className={styles.icon}>groups</span>
          <span>Kader</span>
        </Link>
        <Link className={isInformasi ? styles.navItemActive : styles.navItem} to="/m/puskesmas/informasi">
          <span className={styles.icon}>campaign</span>
          <span>Info</span>
        </Link>
      </div>
    </nav>
  );
}
