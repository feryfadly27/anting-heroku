# Deploy ke Heroku (aplikasi `anting`)

Panduan ini mengasumsikan [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) sudah terpasang dan Anda punya akun Heroku.

## Prasyarat

- Git repository dengan kode aplikasi — **root repo = folder aplikasi** (yang berisi `package.json`, `Procfile`, dan subfolder `deploy-heroku/`)
- Node.js lokal (opsional, untuk cek) — di Heroku versi Node mengikuti field `engines` di `package.json`
- Aplikasi ini memakai **PostgreSQL** (Prisma). Di Heroku perlu addon **Heroku Postgres** agar `DATABASE_URL` tersedia

## Penting: root deploy Git

**Heroku buildpack Node membutuhkan `package.json` di root tree yang di-push.**

Struktur repo yang dipakai di sini: satu repositori Git di folder aplikasi (root berisi `package.json`, `prisma/`, `app/`, dll., plus dokumentasi deploy di `deploy-heroku/`). Push Heroku dilakukan dari folder tersebut (`git push heroku main`).

Jika Anda memakai monorepo (banyak project dalam satu repo), pasang [buildpack monorepo](https://elements.heroku.com/buildpacks/lstoll/heroku-buildpack-monorepo) dan set variabel seperti `APP_BASE` sesuai dokumentasi buildpack.

## Ringkasan alur deploy

1. Login Heroku CLI
2. Buat app (atau pakai app yang sudah ada)
3. Pasang addon Postgres
4. Pastikan `Procfile` ada di root app (lihat [`Procfile.example`](Procfile.example))
5. Pasang remote `heroku` dan push branch utama Anda

## Langkah detail

### 1. Login

```bash
heroku login
```

### 2. Buat aplikasi Heroku

Dari **root aplikasi** (folder yang berisi `package.json`):

```bash
heroku create nama-app-anda
```

Catat nama app dan URL (`https://nama-app-anda.herokuapp.com`).

### 3. PostgreSQL

```bash
heroku addons:create heroku-postgresql:essential-0 -a nama-app-anda
```

Tier bisa disesuaikan. Setelah terpasang, Heroku mengisi **`DATABASE_URL`** otomatis untuk app tersebut.

### 4. Procfile

Root deploy harus berisi `Procfile` dengan:

- **`release`:** `npx prisma migrate deploy` — menerapkan migrasi ke database tiap deploy
- **`web`:** `npm start` — menjalankan server production (`react-router-serve`)

Template ada di [`Procfile.example`](Procfile.example). File aktual di repo ini: [`../Procfile`](../Procfile) (satu folder di atas `deploy-heroku/`).

### 5. Remote Git dan push

Jika belum ada remote:

```bash
heroku git:remote -a nama-app-anda
```

Deploy:

```bash
git push heroku main
```

Ganti `main` dengan nama branch Anda jika berbeda (`master`, dll.).

Atau dari root aplikasi:

```bash
bash deploy-heroku/scripts/deploy.sh main
```

**Push GitHub + Heroku sekaligus** (setelah commit; branch default = branch aktif):

```bash
npm run deploy:all
# atau: bash deploy-heroku/scripts/push-all.sh
# branch tertentu: bash deploy-heroku/scripts/push-all.sh main
# jika sengaja push tanpa working tree bersih: .../push-all.sh --allow-dirty
```

### 6. Cek build dan runtime

```bash
heroku logs --tail -a nama-app-anda
```

Pastikan fase `release` sukses (migrasi) lalu dyno `web` mendengarkan `PORT` dari Heroku.

### 7. Seed database (opsional, sekali atau sesuai kebutuhan)

Seed memakai `tsx` (devDependency). Untuk menjalankan seed di Heroku satu kali:

```bash
heroku run npx tsx prisma/seed.ts -a nama-app-anda
```

Pastikan `DATABASE_URL` sudah ada (Postgres addon aktif).

## Variabel lingkungan tambahan

Jika aplikasi membutuhkan secret lain (JWT, dll.), set melalui:

```bash
heroku config:set NAMA_VAR=nilai -a nama-app-anda
```

Jangan commit file `.env` berisi rahasia produksi.

## Batasan Heroku

- **Filesystem dyno bersifat sementara:** file yang ditulis ke disk lokal bisa hilang saat restart/deploy. Untuk upload file persisten gunakan object storage (mis. S3) atau layanan eksternal.
- **Worker/cron:** butuh dyno terpisah atau Heroku Scheduler sesuai kebutuhan.

## Troubleshooting

| Gejala | Kemungkinan penyebab |
|--------|----------------------|
| Build gagal: tidak ada `package.json` | Root Git salah — pastikan push dari folder yang berisi `package.json` |
| `release` gagal pada migrasi | `DATABASE_URL` kosong, Postgres belum terpasang, atau migrasi bentrok |
| App crash setelah start | Cek `heroku logs`; pastikan `npm run build` sukses di fase build |
| Versi Node tidak sesuai | Sesuaikan `engines.node` di `package.json` |

## Skrip bantu di folder ini

| File | Fungsi |
|------|--------|
| [`scripts/deploy.sh`](scripts/deploy.sh) | Push ke Heroku saja (argumen: nama branch) |
| [`scripts/push-all.sh`](scripts/push-all.sh) | Push **origin** lalu **heroku** (satu branch); gagal jika ada perubahan belum commit |
| [`scripts/check-env.sh`](scripts/check-env.sh) | Cek login Heroku dan remote `git` |
