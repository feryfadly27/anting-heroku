import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Heart, LogOut, Home, Baby, MapPin, Users, Megaphone } from "lucide-react";
import styles from "./dashboard-layout.module.css";
import { Button } from "./ui/button/button";
import { getCurrentUser, logout } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";
import type { User, UserRole } from "~/data/users";

interface DashboardLayoutProps {
  /**
   * The main content to display in the dashboard
   * @important
   */
  children: React.ReactNode;
  /**
   * Optional className for custom styling
   */
  className?: string;
}

const roleLabels: Record<UserRole, string> = {
  orang_tua: "Orang Tua",
  kader: "Kader Posyandu",
  puskesmas: "Puskesmas",
};

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = React.useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem("auth_user_cached");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(user === null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    
    // Async auth check
    getCurrentUser().then(currentUser => {
      if (!currentUser) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("auth_user_cached");
        }
        navigate("/login");
      } else {
        setUser(currentUser);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("auth_user_cached", JSON.stringify(currentUser));
        }
      }
    }).finally(() => {
      setIsCheckingAuth(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("auth_user_cached");
    }
    toast({
      title: "Berhasil keluar",
      description: "Anda telah keluar dari sistem",
    });
    navigate("/");
  };

  if (!user && isCheckingAuth) {
    return <div className={styles.layoutLoading}>Memuat sesi...</div>;
  }

  if (!user) {
    return null;
  }

  const puskesmasMenus = [
    { to: "/puskesmas/dashboard", label: "Beranda", icon: Home },
    { to: "/puskesmas/anak", label: "Anak", icon: Baby },
    { to: "/puskesmas/wilayah", label: "Wilayah", icon: MapPin },
    { to: "/puskesmas/kader", label: "Kader", icon: Users },
    { to: "/puskesmas/informasi", label: "Info", icon: Megaphone },
  ];

  const isPuskesmas = user.role === "puskesmas";

  return (
    <div className={`${styles.layout} ${className || ""}`}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Heart className={styles.logoIcon} />
          <span className={styles.logoText}>Anting</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{roleLabels[user.role]}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className={styles.logoutIcon} />
            Keluar
          </Button>
        </div>
      </header>
      <div className={isPuskesmas ? styles.body : styles.bodyNoSidebar}>
        {isPuskesmas ? (
          <aside className={styles.sidebar}>
            <p className={styles.sidebarTitle}>Menu Puskesmas</p>
            <nav className={styles.sidebarNav}>
              {puskesmasMenus.map((menu) => {
                const Icon = menu.icon;
                const isActive = location.pathname === menu.to;
                return (
                  <Link key={menu.to} to={menu.to} className={isActive ? styles.sidebarLinkActive : styles.sidebarLink}>
                    <Icon className={styles.sidebarIcon} />
                    <span>{menu.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        ) : null}
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
