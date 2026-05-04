import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, Users, Activity } from "lucide-react";
import type { Route } from "./+types/home";
import styles from "./home.module.css";
import { Button } from "~/components/ui/button/button";
import { getCurrentUser, getDashboardPath } from "~/utils/auth";
import {
  BRAND_DESCRIPTION_LONG,
  BRAND_DISPLAY_NAME,
  BRAND_HOME_DOCUMENT_TITLE,
  BRAND_META_DESCRIPTION_SHORT,
  BRAND_TAGLINE,
} from "~/config/branding.display";

export function meta({}: Route.MetaArgs) {
  return [
    { title: BRAND_HOME_DOCUMENT_TITLE },
    {
      name: "description",
      content: BRAND_META_DESCRIPTION_SHORT,
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  // Auto-redirect if already logged in - only run once on mount
  useEffect(() => {
    // Async auth check
    getCurrentUser().then(user => {
      if (user) {
        navigate(getDashboardPath(user.role));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Heart className={styles.logoIcon} />
          <span className={styles.logoText}>{BRAND_DISPLAY_NAME}</span>
        </div>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{BRAND_DISPLAY_NAME}</h1>
        <p className={styles.heroTagline}>{BRAND_TAGLINE}</p>
        <p className={styles.heroDescription}>{BRAND_DESCRIPTION_LONG}</p>
        <div className={styles.heroCta}>
          <Button size="lg" className={styles.primaryButton} onClick={() => navigate("/register")}>
            Mulai Sekarang
          </Button>
          <Button size="lg" variant="outline" className={styles.secondaryButton} onClick={() => navigate("/login")}>
            Masuk ke Akun
          </Button>
        </div>
      </section>

      <section className={styles.overview}>
        <div className={styles.overviewContainer}>
          <h2 className={styles.overviewTitle}>Manfaat {BRAND_DISPLAY_NAME}</h2>
          <div className={styles.overviewGrid}>
            <div className={styles.overviewCard}>
              <Heart className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Pemantauan Kesehatan Bayi</h3>
              <p className={styles.cardDescription}>
                Catat dan pantau perkembangan kesehatan bayi secara terstruktur dengan data yang mudah diakses kapan
                saja
              </p>
            </div>

            <div className={styles.overviewCard}>
              <Users className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Kolaborasi Tim Kesehatan</h3>
              <p className={styles.cardDescription}>
                Memfasilitasi kerja sama antara orang tua, kader posyandu, dan puskesmas dalam pencegahan stunting
              </p>
            </div>

            <div className={styles.overviewCard}>
              <Activity className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Data Terstruktur</h3>
              <p className={styles.cardDescription}>
                Sistem manajemen data kesehatan yang terorganisir untuk memudahkan analisis dan pengambilan keputusan
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
