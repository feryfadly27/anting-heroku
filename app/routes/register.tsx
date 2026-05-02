import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Heart } from "lucide-react";
import type { Route } from "./+types/register";
import styles from "./register.module.css";
import { register, getCurrentUser, getDashboardPath } from "~/utils/auth";
import { toast } from "~/hooks/use-toast";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Daftar - Anting" },
    {
      name: "description",
      content: "Buat akun baru di Anting",
    },
  ];
}

export default function Register() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const checkedRef = useRef(false);
  const [wilayahList, setWilayahList] = useState<Array<{ id: string; nama_wilayah: string; tipe: string }>>([]);
  const [isLoadingWilayah, setIsLoadingWilayah] = useState(true);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Check if user is already logged in
    getCurrentUser().then((user) => {
      if (user) {
        navigate(getDashboardPath(user.role));
      }
    });
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadWilayah = async () => {
      try {
        const response = await fetch("/api/wilayah");
        if (!response.ok) {
          throw new Error("Gagal memuat wilayah");
        }
        const data = await response.json();
        if (isMounted) {
          setWilayahList(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Load wilayah error:", error);
        toast({
          title: "Gagal memuat wilayah",
          description: "Silakan refresh halaman lalu coba lagi.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoadingWilayah(false);
        }
      }
    };

    loadWilayah();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear error
    if (errorRef.current) {
      errorRef.current.textContent = "";
      errorRef.current.style.display = "none";
    }

    const formData = new FormData(formRef.current!);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const wilayahId = formData.get("wilayah_id") as string;

    if (!wilayahId) {
      if (errorRef.current) {
        errorRef.current.textContent = "Silakan pilih wilayah terlebih dahulu";
        errorRef.current.style.display = "block";
      }
      return;
    }

    if (password !== confirmPassword) {
      if (errorRef.current) {
        errorRef.current.textContent = "Password dan konfirmasi password tidak cocok";
        errorRef.current.style.display = "block";
      }
      return;
    }

    if (password.length < 6) {
      if (errorRef.current) {
        errorRef.current.textContent = "Password harus minimal 6 karakter";
        errorRef.current.style.display = "block";
      }
      return;
    }

    // Disable button
    if (buttonRef.current) {
      buttonRef.current.disabled = true;
      buttonRef.current.textContent = "Memproses...";
    }

    try {
      const user = await register(name, email, password, wilayahId);

      if (!user) {
        if (errorRef.current) {
          errorRef.current.textContent = "Gagal mendaftar. Email mungkin sudah digunakan.";
          errorRef.current.style.display = "block";
        }
        if (buttonRef.current) {
          buttonRef.current.disabled = false;
          buttonRef.current.textContent = "Daftar";
        }
        return;
      }

      const dashboardPath = getDashboardPath(user.role);

      toast({
        title: "Pendaftaran berhasil",
        description: `Selamat datang, ${user.name}!`,
      });

      // Navigate using React Router (client-side navigation)
      navigate(dashboardPath);
    } catch (error) {
      console.error("Register error:", error);
      if (errorRef.current) {
        errorRef.current.textContent = "Terjadi kesalahan saat mendaftar. Silakan coba lagi.";
        errorRef.current.style.display = "block";
      }
      if (buttonRef.current) {
        buttonRef.current.disabled = false;
        buttonRef.current.textContent = "Daftar";
      }
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <div className={styles.logoSection}>
          <Heart className={styles.logoIcon} />
          <h1 className={styles.title}>Daftar Anting</h1>
          <p className={styles.subtitle}>Mulai pantau kesehatan bayi Anda</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
          <div ref={errorRef} className={styles.errorMessage} style={{ display: "none" }} />

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Nama Lengkap
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={styles.input}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

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
            <label htmlFor="wilayah_id" className={styles.label}>
              Wilayah
            </label>
            <select
              id="wilayah_id"
              name="wilayah_id"
              className={styles.input}
              defaultValue=""
              required
              disabled={isLoadingWilayah}
            >
              <option value="" disabled>
                {isLoadingWilayah ? "Memuat wilayah..." : "Pilih wilayah"}
              </option>
              {wilayahList.map((wilayah) => (
                <option key={wilayah.id} value={wilayah.id}>
                  {wilayah.nama_wilayah} ({wilayah.tipe})
                </option>
              ))}
            </select>
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
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className={styles.input}
              placeholder="Masukkan password lagi"
              required
            />
          </div>

          <button type="submit" className={styles.submitButton} ref={buttonRef} disabled={isLoadingWilayah}>
            Daftar
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>atau</span>
          <div className={styles.dividerLine} />
        </div>

        <p className={styles.loginPrompt}>
          Sudah punya akun?{" "}
          <Link to="/login" className={styles.loginLink}>
            Masuk di sini
          </Link>
        </p>

        <div className={styles.infoBox}>
          Pendaftaran ini khusus untuk orang tua. Untuk akun Kader Posyandu atau Puskesmas, silakan hubungi
          administrator.
        </div>
      </div>
    </div>
  );
}
