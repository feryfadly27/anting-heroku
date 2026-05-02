import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Heart } from "lucide-react";
import type { Route } from "./+types/login";
import styles from "./login.module.css";
import { login, getCurrentUser, getDashboardPath } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Masuk - Anting" },
    {
      name: "description",
      content: "Masuk ke akun Anting Anda",
    },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const checkedRef = useRef(false);
  
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    
    // Check if user is already logged in
    getCurrentUser().then(user => {
      if (user) {
        navigate(getDashboardPath(user.role));
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear error
    if (errorRef.current) {
      errorRef.current.textContent = "";
      errorRef.current.style.display = "none";
    }
    
    // Disable button
    if (buttonRef.current) {
      buttonRef.current.disabled = true;
      buttonRef.current.textContent = "Memproses...";
    }

    try {
      const formData = new FormData(formRef.current!);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const user = await login(email, password);

      if (user) {
        const dashboardPath = getDashboardPath(user.role);
        
        toast({
          title: "Berhasil masuk",
          description: `Selamat datang, ${user.name}!`,
        });
        
        // Navigate using React Router (client-side navigation)
        navigate(dashboardPath);
      } else {
        if (errorRef.current) {
          errorRef.current.textContent = "Email atau password salah. Silakan coba lagi.";
          errorRef.current.style.display = "block";
        }
        if (buttonRef.current) {
          buttonRef.current.disabled = false;
          buttonRef.current.textContent = "Masuk";
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (errorRef.current) {
        errorRef.current.textContent = "Terjadi kesalahan. Silakan coba lagi.";
        errorRef.current.style.display = "block";
      }
      if (buttonRef.current) {
        buttonRef.current.disabled = false;
        buttonRef.current.textContent = "Masuk";
      }
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.logoSection}>
          <Heart className={styles.logoIcon} />
          <h1 className={styles.title}>Masuk ke Anting</h1>
          <p className={styles.subtitle}>Kelola kesehatan bayi dengan mudah</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
          <div ref={errorRef} className={styles.errorMessage} style={{ display: "none" }} />

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              placeholder="nama@email.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              placeholder="Masukkan password"
              required
            />
          </div>

          <div className={styles.forgotPassword}>
            <a href="#" className={styles.forgotPasswordLink}>
              Lupa password?
            </a>
          </div>

          <button type="submit" className={styles.submitButton} ref={buttonRef}>
            Masuk
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>atau</span>
          <div className={styles.dividerLine} />
        </div>

        <p className={styles.registerPrompt}>
          Belum punya akun?{" "}
          <Link to="/register" className={styles.registerLink}>
            Daftar sekarang
          </Link>
        </p>

        <div className={styles.demoCredentials}>
          <p className={styles.demoTitle}>Akun Demo:</p>
          <div className={styles.demoList}>
            <div className={styles.demoItem}>
              <span className={styles.demoRole}>Orang Tua:</span>
              <span>siti@parent.com / parent123</span>
            </div>
            <div className={styles.demoItem}>
              <span className={styles.demoRole}>Kader Posyandu:</span>
              <span>aminah@cadre.com / cadre123</span>
            </div>
            <div className={styles.demoItem}>
              <span className={styles.demoRole}>Puskesmas:</span>
              <span>budi@puskesmas.com / puskesmas123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
