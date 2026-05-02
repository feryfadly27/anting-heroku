import type { User, UserRole } from "~/data/users";

export interface AuthSession {
  user: User;
  timestamp: number;
}

/**
 * Login with Internal API backend
 */
export async function login(email: string, password: string): Promise<User | null> {
  try {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Login failed:", errorData.error);
      return null;
    }

    const { user } = await response.json();
    console.log("✅ Login successful:", user.name);
    return user;
  } catch (error) {
    console.error("Login exception:", error);
    return null;
  }
}

/**
 * Register new user with Internal API
 */
export async function register(name: string, email: string, password: string, wilayahId: string): Promise<User | null> {
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("wilayah_id", wilayahId);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Registration failed:", errorData.error);
      return null;
    }

    const { user } = await response.json();
    console.log("✅ Registration successful:", user.name);
    return user;
  } catch (error) {
    console.error("Register exception:", error);
    return null;
  }
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    if (response.ok) {
      console.log("✅ Logged out successfully");
    } else {
      console.error("❌ Logout failed");
    }
  } catch (error) {
    console.error("Logout exception:", error);
  }
}

/**
 * Get current authenticated user from internal session
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) return null;

    const { user } = await response.json();
    return user || null;
  } catch (error) {
    console.error("getCurrentUser exception:", error);
    return null;
  }
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "orang_tua":
      return "/m/parent/dashboard";
    case "kader":
      return "/m/cadre/dashboard";
    case "puskesmas":
      return "/m/puskesmas/dashboard";
    default:
      return "/";
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
