# Mobile + PWA QA Checklist

Dokumen ini untuk validasi hasil implementasi mobile-first dan PWA basic pada SI Banting.

## 1) Mobile UX (Parent Dashboard)

- [ ] Buka `http://localhost:5173/m/parent/dashboard` di lebar 320px-430px.
- [ ] Semua tombol utama memiliki area sentuh yang nyaman (min 44px).
- [ ] Bottom navigation tetap terlihat dan tidak tertutup safe-area perangkat.
- [ ] Status pertumbuhan dan status gizi mudah dibaca tanpa zoom.
- [ ] Tombol `Status` dan `Anak` pada nav bawah melakukan scroll halus ke section terkait.
- [ ] Saat gagal memuat data, kartu error tampil dengan tombol `Coba Lagi`.

## 2) Installability PWA

- [ ] `manifest.webmanifest` bisa diakses dari browser (`/manifest.webmanifest`).
- [ ] `sw.js` bisa diakses dari browser (`/sw.js`).
- [ ] Service worker terdaftar di DevTools > Application > Service Workers.
- [ ] App dapat di-Install/Add to Home Screen.
- [ ] Saat dibuka dari home screen, tampilan mode standalone aktif.

## 3) Offline Basic (Read-only Cache)

- [ ] Buka halaman parent mobile saat online minimal sekali.
- [ ] Nonaktifkan internet.
- [ ] Reload halaman yang sudah pernah dibuka; shell aplikasi tetap muncul.
- [ ] Endpoint GET `/api/*` yang pernah diakses tetap bisa dibaca dari cache.
- [ ] Route yang belum pernah dibuka menampilkan fallback `offline.html`.

## 4) Cache Invalidation

- [ ] Naikkan `CACHE_VERSION` di `public/sw.js`.
- [ ] Reload app dan pastikan cache lama dibersihkan (lihat Application > Cache Storage).
- [ ] Data baru terambil saat kembali online.

## 5) Catatan Batasan Saat Ini

- Offline saat ini bersifat basic/read-only.
- Operasi tulis (submit form POST/PUT/DELETE) tetap membutuhkan koneksi online.
