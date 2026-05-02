# Catatan Troubleshooting - SI Banting

## Masalah: Tidak Bisa Login

### Penyebab
Ada **2 masalah** yang terjadi bersamaan:

### 1. Database Container Tidak Aktif
- Database MySQL berjalan di Podman container bernama `mysql-sir-kp` pada port `3307`
- Container ini mati/exited dan perlu di-start manual setiap kali komputer dinyalakan ulang

**Solusi:**
```bash
podman start mysql-sir-kp
```

### 2. Password Sudah Ter-hash (Tidak Bisa Pakai Password Lama)
- Sistem login di `auth.server.ts` memiliki fitur **auto-hash**: saat login pertama (dengan password plain text dari seed data), password otomatis di-hash menggunakan bcrypt
- Setelah di-hash, password plain text lama **tidak bisa digunakan lagi** karena sudah berubah di database
- Jika lupa password, perlu di-reset manual via script

**Solusi:** Jalankan script `reset-password.cjs` untuk reset password akun tertentu

## Checklist Sebelum Menjalankan Sistem

1. ✅ Pastikan Podman machine aktif: `podman machine start`
2. ✅ Start container database: `podman start mysql-sir-kp`
3. ✅ Jalankan server: `npm run dev` atau double-click `run-server.bat`
4. ✅ Akses di browser: `http://localhost:5173`

## Daftar Akun (Email)
| Role | Email |
|------|-------|
| orang_tua | dewi.lestari@parent.com |
| orang_tua | siti.aminah@parent.com |
| orang_tua | siti@parent.com |
| orang_tua | budi@parent.com |
| kader | aminah@cadre.com |
| puskesmas | budi@puskesmas.com |
