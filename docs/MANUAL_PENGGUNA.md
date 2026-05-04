# Manual penggunaan sistem Diari

**Diari** (*Data Informasi Anak Responsif & Terintegrasi*) adalah nama tampilan aplikasi; repositori/kode internal dapat tetap memakai nama proyek *Anting*. Aplikasi ini memantau tumbuh kembang balita. Dokumen berikut menjelaskan **alur penggunaan** dari awal dan **panduan operasional khusus peran Puskesmas** (desktop dan mobile).

---

## 1. Peran dan struktur data

| Peran | Keterangan singkat |
|--------|-------------------|
| **Orang tua** | Memiliki akun terikat **wilayah** (desa/kelurahan); mengelola data anak, pertumbuhan, imunisasi, dan membaca informasi. |
| **Kader** | Bertugas di wilayah tertentu; memantau anak di wilayah kerjanya, rekap, dan informasi. |
| **Puskesmas** | Mengawasi seluruh wilayah kerja; melihat agregat data, mengelola **wilayah**, **kader**, **informasi**, dan **daftar anak**. |

**Hierarki konseptual:** satu entitas puskesmas memiliki banyak **wilayah** (tipe: desa, kelurahan, atau entri puskesmas). Orang tua dan kader terhubung ke sebuah wilayah. Data anak (`anak`) milik orang tua; pemeriksaan pertumbuhan dan imunisasi tercatat per anak.

---

## 2. Alur sistem (dari beranda sampai dashboard)

```mermaid
flowchart TD
  home[Beranda /] --> choice{Pengguna}
  choice -->|Belum punya akun| reg[Daftar /register]
  choice -->|Sudah punya akun| login[Masuk /login]
  reg --> pilihWilayah[Pilih wilayah]
  pilihWilayah --> akunOT[Akun orang tua dibuat]
  akunOT --> dashOT[Dashboard orang tua]
  login --> cekPeran{Peran}
  cekPeran -->|orang_tua| dashOT
  cekPeran -->|kader| dashK[/m/cadre/dashboard]
  cekPeran -->|puskesmas| dashP[/m/puskesmas/dashboard]
```

### 2.1 Beranda

- URL: `/`
- Menampilkan pengenalan Diari dan tombol untuk **Mulai Sekarang** (mengarah ke pendaftaran) atau **Masuk**.
- Jika pengguna **sudah login** (sesi masih valid), sistem mengarahkan otomatis ke dashboard sesuai peran (lihat tabel di bawah).

### 2.2 Pendaftaran (orang tua)

- URL: `/register`
- Form: nama, email, password, dan **pemilihan wilayah** (data diambil dari server).
- Akun yang dibuat melalui halaman ini adalah peran **orang tua** dengan wilayah yang dipilih.
- Setelah berhasil, pengguna biasanya langsung masuk ke dashboard orang tua.

### 2.3 Masuk

- URL: `/login`
- Form: email dan password.
- Setelah berhasil, pengguna diarahkan ke:

| Peran | URL dashboard utama (mobile-first) |
|--------|-----------------------------------|
| Orang tua | `/m/parent/dashboard` |
| Kader | `/m/cadre/dashboard` |
| Puskesmas | `/m/puskesmas/dashboard` |

### 2.4 Keluar

- Gunakan tombol **Keluar** di layout (di mana tersedia) atau alur logout aplikasi; sesi di server/browser dihapus dan pengguna kembali ke alur publik.

### 2.5 Catatan akun Puskesmas dan Kader

- **Registrasi mandiri** di `/register` hanya untuk **orang tua**.
- Akun **Puskesmas** dan **Kader** pada lingkungan pengembangan/demo sering dibuat lewat data awal (seed) atau oleh administrator sistem di lingkungan produksi. Prosedur pembuatan akun produksi mengikuti kebijakan instansi Anda (di luar cakupan antarmuka publik saat ini).

---

## 3. Ringkasan untuk Orang Tua dan Kader

### Orang tua (utama: mobile)

- Dashboard: `/m/parent/dashboard`
- Profil ibu, daftar anak, status, informasi, serta form tambah anak, pertumbuhan, imunisasi (URL di bawah `/m/parent/...`).
- Orang tua hanya melihat dan mengelola data yang relevan dengan akunnya.

### Kader (utama: mobile)

- Dashboard: `/m/cadre/dashboard`
- Daftar anak di wilayah kerja, detail anak, rekap, informasi (`/m/cadre/...`).

Bagian berikut fokus pada **Puskesmas**.

---

## 4. Penggunaan tingkat Puskesmas

Puskesmas punya dua “cara” mengakses fitur yang sama: **versi mobile** (default setelah login) dan **versi desktop** (sidebar lebar, cocok untuk layar komputer).

### 4.1 Ringkasan URL

| Fitur | Desktop | Mobile |
|--------|---------|--------|
| Dashboard | `/puskesmas/dashboard` | `/m/puskesmas/dashboard` |
| Data anak | `/puskesmas/anak` | `/m/puskesmas/anak` |
| Wilayah | `/puskesmas/wilayah` | `/m/puskesmas/wilayah` |
| Kader | `/puskesmas/kader` | `/m/puskesmas/kader` |
| Informasi | `/puskesmas/informasi` | `/m/puskesmas/informasi` |
| Detail anak | `/puskesmas/anak/:id` | (sesuai tautan dari daftar anak di mobile) |

**Navigasi desktop:** setelah membuka salah satu URL desktop di atas, menu samping menampilkan **Beranda, Anak, Wilayah, Kader, Info**.

**Navigasi mobile:** bilah navigasi bawah dengan ikon yang mengarah ke halaman setara.

---

### 4.2 Dashboard Puskesmas

**Desktop** (`/puskesmas/dashboard`)

- Ringkasan statistik wilayah kerja (jumlah balita, kader, wilayah, indikator gizi, prevalensi, cakupan pemeriksaan—sesuai data di server).
- Tombol **Refresh** untuk memuat ulang data.
- **Export CSV** dan **Export PDF** untuk mengunduh ringkasan data ekspor.
- Tab **Analitik & Prevalensi**
  - **Filter wilayah:** dropdown “Semua Wilayah” atau satu wilayah tertentu; grafik dan tabel prevalensi mengikuti filter.
  - Grafik / komponen prevalensi bulanan dan per wilayah.
- Tab **Manajemen Kader**
  - Menambah, mengubah, dan menghapus akun kader (nama, email, password, penempatan wilayah) melalui formulir di dalam tab; setelah aksi, data dapat di-refresh.

**Mobile** (`/m/puskesmas/dashboard`)

- Ringkasan angka dan daftar ringkas (wilayah, kader, anak prioritas) disesuaikan dengan layar kecil; prinsip data sama dengan dashboard desktop.

---

### 4.3 Halaman Data Anak

**Desktop** (`/puskesmas/anak`)

- Daftar balita di wilayah kerja puskesmas dengan ringkasan: nama, umur, orang tua, wilayah, pengukuran terakhir, jumlah entri pertumbuhan/imunisasi, dan skor Z terakhir (jika ada).
- **Pencarian** kata kunci dan filter prioritas (mis. semua / prioritas tinggi / perlu perhatian) membantu menargetkan kunjungan ulang.
- Tautan ke **detail anak** (`/puskesmas/anak/:id`) untuk melihat lebih dalam (sesuai implementasi halaman detail).

**Mobile** (`/m/puskesmas/anak`)

- Daftar anak dengan filter dan navigasi yang disederhanakan untuk sentuhan.

---

### 4.4 Halaman Wilayah

**Desktop** (`/puskesmas/wilayah`)

- Tabel wilayah dengan statistik balita, stunting, dan prevalensi per wilayah (diurutkan menurut prevalensi).
- **Menambah wilayah baru:** nama wilayah dan tipe (desa / kelurahan / puskesmas).
- **Mengubah** atau **menghapus** wilayah melalui aksi pada baris (sesuai tombol di halaman).
- Tombol **Refresh** untuk memuat ulang.

**Mobile** (`/m/puskesmas/wilayah`)

- Manajemen wilayah dalam tampilan mobile (form dan daftar setara).

Wilayah yang ditambahkan di sini akan muncul di pemilihan wilayah saat **pendaftaran orang tua** dan saat **menempatkan kader**.

---

### 4.5 Halaman Kader

**Desktop** (`/puskesmas/kader`)

- Daftar kader: nama, email, wilayah tugas, jumlah balita terkait, jumlah pemeriksaan.
- **Menambah kader:** nama, email, password awal, wilayah penugasan.
- **Mengubah** data kader (termasuk pembaruan password jika diisi) dan **menghapus** kader sesuai kontrol di halaman.

**Mobile** (`/m/puskesmas/kader`)

- Operasi yang sama dalam layout mobile.

---

### 4.6 Halaman Informasi

**Desktop** (`/puskesmas/informasi`)

- Form **publikasi informasi:** judul, kategori (Kegiatan, Penyuluhan, Gizi, Pengumuman), isi konten, lalu tombol **Publikasikan**.
- Daftar informasi yang sudah dipublikasikan dengan **filter** menurut kategori.

**Mobile** (`/m/puskesmas/informasi`)

- Membuat dan melihat informasi dalam tampilan mobile.

Informasi yang dipublikasikan dapat dibaca oleh peran lain (orang tua / kader) di menu informasi masing-masing.

---

## 5. Lingkungan demo dan produksi

- Pada database **seed** pengembangan, sering tersedia akun contoh (email/password demo). **Jangan memakai password lemah di produksi**; ganti atau nonaktifkan akun demo sesuai SOP keamanan instansi.
- Untuk deployment server (mis. Heroku), lihat panduan teknis di folder `deploy-heroku/`.

---

## 6. Glosarium singkat

| Istilah | Arti dalam aplikasi |
|---------|---------------------|
| Balita / anak | Rekaman anak yang dimiliki orang tua di sistem. |
| Pertumbuhan | Riwayat pengukuran berat, tinggi, lingkar kepala, LILA, dan skor Z terkait. |
| Imunisasi | Riwayat pemberian imunisasi per anak. |
| Wilayah | Desa, kelurahan, atau entitas puskesmas sebagai unit administratif di bawah kerja puskesmas. |
| Prevalensi | Proporsi indikator (mis. stunting) terhadap populasi balita di wilayah/filter yang dipilih. |

---

_Dokumen ini diselaraskan dengan struktur rute dan perilaku UI di repositori aplikasi. Jika fitur di kode berubah, perbarui manual ini agar tetap akurat._
