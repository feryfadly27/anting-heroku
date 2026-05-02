import { Link, useLocation } from "react-router";
import styles from "./mobile-cadre-nav.module.css";

export function MobileCadreNav() {
  const path = useLocation().pathname;
  const isHome = path === "/m/cadre/dashboard";
  const isAnak = path === "/m/cadre/anak";
  const isRekap = path === "/m/cadre/rekap";
  const isInformasi = path === "/m/cadre/informasi";

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navInner}>
        <Link className={isHome ? styles.navItemActive : styles.navItem} to="/m/cadre/dashboard">
          <span className={styles.iconFilled}>home</span>
          <span>Beranda</span>
        </Link>
        <Link className={isAnak ? styles.navItemActive : styles.navItem} to="/m/cadre/anak">
          <span className={styles.icon}>groups</span>
          <span>Anak</span>
        </Link>
        <Link className={isRekap ? styles.navItemActive : styles.navItem} to="/m/cadre/rekap">
          <span className={styles.icon}>analytics</span>
          <span>Rekap</span>
        </Link>
        <Link className={isInformasi ? styles.navItemActive : styles.navItem} to="/m/cadre/informasi">
          <span className={styles.icon}>campaign</span>
          <span>Info</span>
        </Link>
      </div>
    </nav>
  );
}
