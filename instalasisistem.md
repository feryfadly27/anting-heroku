# Panduan Instalasi Sistem (Server/PC Lain)

Dokumen ini menjelaskan kebutuhan sistem dan langkah instalasi aplikasi agar bisa berjalan stabil di mesin lain (Linux/macOS/Windows WSL).

## 1) Kebutuhan Sistem

### Minimum
- CPU 2 core
- RAM 4 GB
- Storage kosong minimal 2 GB
- Koneksi internet (untuk instalasi dependency)

### Software Wajib
- Node.js **v20 LTS atau lebih baru**
- npm **v10 atau lebih baru**
- PostgreSQL **v14 atau lebih baru**
- Git

## 2) Clone Project

```bash
git clone <url-repository-anda>
cd anting
```

## 3) Setup Environment Variable

1. Salin file contoh env:

```bash
cp .env.example .env
```

2. Isi nilai di `.env` sesuai server Anda:

- `DATABASE_URL` (PostgreSQL)

Contoh format `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:passwordkuat@127.0.0.1:5432/sir_kp_banting?schema=public"
```

## 4) Install Dependency

```bash
npm install
```

## 5) Setup Database Prisma

Jalankan migrasi dan generate Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Untuk environment development baru, jika perlu data awal:

```bash
npx tsx prisma/seed.ts
```

## 6) Jalankan Aplikasi (Port Acak Supaya Tidak Bentrok)

Port default umum sering bentrok (3000/5173/8080).  
Di project ini, gunakan port acak **43891**.

### Opsi A - Script helper (direkomendasikan)

```bash
bash ./jalankansistem.sh --port 43891
```

### Opsi B - Menjalankan dev server langsung

```bash
npm run dev -- --host 0.0.0.0 --port 43891
```

Akses aplikasi:

```text
http://localhost:43891
```

Jika di server remote, buka firewall/security group untuk TCP `43891`.

## 7) Menjalankan Mode Production

Build aplikasi:

```bash
npm run build
```

Jalankan server production pada port acak yang sama:

```bash
PORT=43891 npm start
```

## 8) Verifikasi Cepat

Setelah aplikasi jalan, cek endpoint berikut:
- `/`
- `/login`
- `/m/parent/dashboard`

Jika Anda melakukan seed data, akun contoh yang tersedia:
- `siti@parent.com` / `parent123`

## 9) Troubleshooting Umum

- **`.env` tidak ditemukan**  
  Pastikan sudah membuat `.env` dari `.env.example`.

- **Tidak bisa konek database**  
  Cek service PostgreSQL aktif dan nilai `DATABASE_URL` benar.

- **Port sudah dipakai**  
  Ganti ke port acak lain, misalnya:
  - `45127`
  - `46203`
  - `47991`

- **Module/Prisma error setelah pull terbaru**  
  Jalankan ulang:
  ```bash
  npm install
  npx prisma generate
  npx prisma migrate deploy
  ```
