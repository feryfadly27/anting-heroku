# Setup Database - SI Banting

Panduan lengkap untuk mengonfigurasi database Supabase untuk sistem SI Banting.

## Prerequisites

1. **Akun Supabase**
   - Buat akun gratis di [supabase.com](https://supabase.com)
   - Buat project baru

2. **Node.js & npm**
   - Pastikan sudah terinstall di sistem Anda

---

## Langkah 1: Dapatkan Credentials Supabase

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka **Settings** → **API**
4. Catat nilai berikut:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (Key yang dimulai dengan `eyJ...`)

---

## Langkah 2: Konfigurasi Environment Variables

1. Copy file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit file `.env` dan isi dengan credentials Supabase Anda:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Langkah 3: Jalankan Database Migration

### Opsi A: Via Supabase Dashboard (Recommended)

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor** dari menu sidebar
4. Klik **New Query**
5. Copy seluruh isi file `app/db/migrations/001_initial_schema.sql`
6. Paste ke SQL Editor
7. Klik **Run** atau tekan `Ctrl+Enter`

### Opsi B: Via Supabase CLI (Advanced)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login ke Supabase:
   ```bash
   supabase login
   ```

3. Link ke project Anda:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Push migration:
   ```bash
   supabase db push
   ```

---

## Langkah 4: Verifikasi Setup

1. Buka **Table Editor** di Supabase Dashboard
2. Pastikan 3 tabel sudah terbuat:
   - ✅ `users`
   - ✅ `anak`
   - ✅ `wilayah`

3. Cek sample data sudah ada:
   - 5 wilayah
   - 3 users (1 orang tua, 1 kader, 1 puskesmas)
   - 2 anak

---

## Langkah 5: Test Aplikasi

1. Install dependencies:
   ```bash
   npm install
   ```

2. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

3. Buka browser di `http://localhost:5173`

4. Test login dengan kredensial sample:
   
   **Orang Tua:**
   - Email: `siti@parent.com`
   - Password: `parent123`
   
   **Kader:**
   - Email: `aminah@cadre.com`
   - Password: `cadre123`
   
   **Puskesmas:**
   - Email: `budi@puskesmas.com`
   - Password: `puskesmas123`

---

## Struktur Database

### Tabel: `wilayah`
Menyimpan data wilayah (desa, kelurahan, puskesmas).

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary Key |
| nama_wilayah | VARCHAR | Nama wilayah |
| tipe | ENUM | 'desa', 'kelurahan', atau 'puskesmas' |

### Tabel: `users`
Menyimpan data pengguna dengan role-based access.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary Key |
| name | VARCHAR | Nama lengkap |
| email | VARCHAR | Email (unique) |
| password | VARCHAR | Password (harus di-hash) |
| role | ENUM | 'orang_tua', 'kader', atau 'puskesmas' |
| wilayah_id | UUID | Foreign Key ke wilayah (nullable) |
| created_at | TIMESTAMPTZ | Waktu registrasi |

### Tabel: `anak`
Menyimpan data anak yang terdaftar.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary Key |
| user_id | UUID | Foreign Key ke users |
| nama | VARCHAR | Nama anak |
| tanggal_lahir | DATE | Tanggal lahir |
| jenis_kelamin | ENUM | 'laki-laki' atau 'perempuan' |
| created_at | TIMESTAMPTZ | Waktu registrasi |

### Relasi:
```
wilayah (1) ←--→ (0..n) users
users (1) ←--→ (0..n) anak
```

---

## Row Level Security (RLS)

Database menggunakan Row Level Security untuk keamanan:

### Users Table:
- ✅ Users hanya bisa lihat/update data mereka sendiri

### Anak Table:
- ✅ Orang tua: CRUD data anak mereka sendiri
- ✅ Kader & Puskesmas: Lihat semua anak di wilayah mereka

### Wilayah Table:
- ✅ Semua user bisa lihat data wilayah

---

## Troubleshooting

### Error: "Invalid API Key"
- Pastikan `SUPABASE_ANON_KEY` di `.env` sudah benar
- Key harus dimulai dengan `eyJ...`

### Error: "Failed to connect to database"
- Cek `SUPABASE_URL` sudah benar
- Pastikan project Supabase masih aktif

### Tabel tidak muncul
- Pastikan migration sudah dijalankan dengan benar
- Cek di SQL Editor apakah ada error saat run migration

### Sample users tidak bisa login
- Pastikan sample data sudah di-insert
- Cek di Table Editor apakah data users ada

---

## Security Notes

⚠️ **PENTING untuk Production:**

1. **Password Hashing**
   - Sample data menggunakan plain password
   - Di production, WAJIB gunakan bcrypt/argon2
   - Update migration untuk hash password

2. **Environment Variables**
   - Jangan commit file `.env` ke git
   - File `.env` sudah ada di `.gitignore`

3. **RLS Policies**
   - Verifikasi policies sudah sesuai requirement
   - Test akses antar role dengan teliti

4. **API Keys**
   - Jangan share `SUPABASE_ANON_KEY` di public
   - Untuk production, gunakan service role key dengan hati-hati

---

## Next Steps

Setelah database setup berhasil:

1. ✅ Implementasi password hashing (bcrypt)
2. ✅ Buat tabel tambahan untuk fitur lanjutan:
   - `posyandu_records` - Record kunjungan
   - `measurements` - Data pengukuran (berat, tinggi)
   - `immunizations` - Jadwal imunisasi
3. ✅ Implementasi real-time subscription untuk update data
4. ✅ Buat API endpoints untuk CRUD operations
5. ✅ Implementasi form untuk mengelola data anak

---

## Bantuan

Untuk pertanyaan atau masalah:
- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🐛 Buka issue di repository ini
