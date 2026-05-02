# Database Schema - SI Banting

Database schema untuk sistem Rekam Kesehatan Personal (RKP) Bayi Cegah Stunting.

## Struktur Database

### 1. Tabel `wilayah`
Menyimpan data wilayah administrasi (desa, kelurahan, puskesmas).

**Kolom:**
- `id` (UUID, PK) - ID unik wilayah
- `nama_wilayah` (VARCHAR) - Nama wilayah
- `tipe` (ENUM) - Tipe wilayah: 'desa', 'kelurahan', atau 'puskesmas'
- `created_at` (TIMESTAMPTZ) - Waktu pembuatan record

**Indexes:**
- `idx_wilayah_tipe` - Index pada kolom tipe
- `idx_wilayah_nama` - Index pada kolom nama_wilayah

---

### 2. Tabel `users`
Menyimpan data pengguna sistem dengan role-based access.

**Kolom:**
- `id` (UUID, PK) - ID unik user
- `name` (VARCHAR) - Nama lengkap user
- `email` (VARCHAR, UNIQUE) - Email user
- `password` (VARCHAR) - Password (harus di-hash di production)
- `role` (ENUM) - Role: 'orang_tua', 'kader', atau 'puskesmas'
- `wilayah_id` (UUID, FK, NULLABLE) - Referensi ke tabel wilayah
- `created_at` (TIMESTAMPTZ) - Waktu registrasi

**Foreign Keys:**
- `wilayah_id` → `wilayah(id)` - ON DELETE SET NULL, ON UPDATE CASCADE

**Indexes:**
- `idx_users_email` - Unique index pada email
- `idx_users_role` - Index pada role
- `idx_users_wilayah` - Index pada wilayah_id

---

### 3. Tabel `anak`
Menyimpan data anak yang terdaftar dalam sistem RKP.

**Kolom:**
- `id` (UUID, PK) - ID unik anak
- `user_id` (UUID, FK) - Referensi ke orang tua (user dengan role 'orang_tua')
- `nama` (VARCHAR) - Nama lengkap anak
- `tanggal_lahir` (DATE) - Tanggal lahir anak
- `jenis_kelamin` (ENUM) - Jenis kelamin: 'laki_laki' atau 'perempuan'
- `created_at` (TIMESTAMPTZ) - Waktu registrasi anak

**Foreign Keys:**
- `user_id` → `users(id)` - ON DELETE CASCADE, ON UPDATE CASCADE

**Indexes:**
- `idx_anak_user_id` - Index pada user_id
- `idx_anak_tanggal_lahir` - Index pada tanggal_lahir

---

## Relasi Antar Tabel

```
wilayah (1) ←--→ (0..n) users
users (1) ←--→ (0..n) anak
```

### Penjelasan Relasi:

1. **wilayah → users**: Satu wilayah dapat memiliki banyak user (orang tua, kader, puskesmas)
2. **users → anak**: Satu user (orang tua) dapat memiliki banyak anak

---

## Row Level Security (RLS)

### Policies untuk tabel `users`:
- Users hanya dapat melihat dan update data mereka sendiri

### Policies untuk tabel `anak`:
- **Orang Tua**: Dapat CRUD data anak mereka sendiri
- **Kader & Puskesmas**: Dapat melihat semua data anak di wilayah mereka

### Policies untuk tabel `wilayah`:
- Semua user dapat melihat data wilayah

---

## Setup Instructions

### 1. Konfigurasi Environment Variables

Tambahkan koneksi PostgreSQL di file `.env`:

```env
DATABASE_URL="postgresql://postgres:your_password@127.0.0.1:5432/sir_kp_banting?schema=public"
```

### 2. Jalankan Migration

Gunakan Prisma migration command:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Verifikasi

Cek bahwa semua tabel dan relasi sudah terbuat dengan benar:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## Sample Data

Migration sudah include sample data untuk testing:

**Wilayah:**
- Puskesmas Sentral
- Kelurahan Maju Jaya
- Desa Sejahtera
- Kelurahan Harmoni
- Desa Makmur

**Users:**
- Ibu Siti Nurhaliza (orang_tua)
- Kader Aminah (kader)
- Dr. Budi Santoso (puskesmas)

**Anak:**
- Ahmad Rizki (anak dari Ibu Siti)
- Siti Aisyah (anak dari Ibu Siti)

---

## Security Notes

⚠️ **PENTING**: 
- Password di sample data **TIDAK DI-HASH**. Di production, wajib gunakan bcrypt atau argon2.
- Pastikan RLS policies sudah dikonfigurasi dengan benar sebelum deploy ke production.
- Gunakan environment variables untuk menyimpan credentials, jangan hardcode.

---

## Future Enhancements

Tabel tambahan yang mungkin diperlukan:

1. **posyandu_records** - Record kunjungan posyandu
2. **measurements** - Data pengukuran (berat, tinggi, lingkar kepala)
3. **immunizations** - Jadwal dan record imunisasi
4. **notifications** - Sistem notifikasi untuk reminder
5. **activity_logs** - Audit trail untuk tracking aktivitas user
