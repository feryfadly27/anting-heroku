export type UserRole = "orang_tua" | "kader" | "puskesmas";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  wilayah_id?: string | null;
  created_at?: string;
}

export const mockUsers: User[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    name: "Ibu Siti Nurhaliza",
    email: "siti@parent.com",
    password: "parent123",
    role: "orang_tua",
    wilayah_id: null,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "30000000-0000-0000-0000-000000000001",
    name: "Kader Aminah",
    email: "aminah@cadre.com",
    password: "cadre123",
    role: "kader",
    wilayah_id: "wilayah_001",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "40000000-0000-0000-0000-000000000001",
    name: "Dr. Budi Santoso",
    email: "budi@puskesmas.com",
    password: "puskesmas123",
    role: "puskesmas",
    wilayah_id: null,
    created_at: "2024-01-01T00:00:00Z",
  },
];
