import { Link, useLocation } from "react-router";
import styles from "./mobile-parent-nav.module.css";

export function MobileParentNav() {
  const location = useLocation();
  const path = location.pathname;

  const isDashboard = path === "/m/parent/dashboard";
  const isProfilIbu = path === "/m/parent/profil-ibu";
  const isAnak = path === "/m/parent/anak" || (path.startsWith("/m/parent/anak/") && path !== "/m/parent/anak/new");
  const isInformasi = path === "/m/parent/informasi";

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navInner}>
        <Link className={isDashboard ? styles.navItemActive : styles.navItem} to="/m/parent/dashboard">
          <span className={styles.iconFilled}>home</span>
          <span>Beranda</span>
        </Link>
        <Link className={isProfilIbu ? styles.navItemActive : styles.navItem} to="/m/parent/profil-ibu">
          <span className={styles.icon}>badge</span>
          <span>Profil Ibu</span>
        </Link>
        <Link className={isAnak ? styles.navItemActive : styles.navItem} to="/m/parent/anak">
          <span className={styles.icon}>groups</span>
          <span>Anak</span>
        </Link>
        <Link className={isInformasi ? styles.navItemActive : styles.navItem} to="/m/parent/informasi">
          <span className={styles.icon}>campaign</span>
          <span>Info</span>
        </Link>
      </div>
    </nav>
  );
}
