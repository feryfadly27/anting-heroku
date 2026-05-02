# Fitur Dashboard Kader Posyandu

Dokumen ini menjelaskan fitur-fitur yang tersedia untuk role **Kader** dalam sistem SI Banting.

## 📋 Fitur Utama

### 1. **Melihat Daftar Anak di Wilayah Binaan**

Kader dapat melihat semua anak yang terdaftar di wilayah binaannya dengan informasi lengkap:

- **Informasi Dasar:**
  - Nama anak
  - Nama orang tua
  - Jenis kelamin
  - Tanggal lahir & umur
  
- **Data Pertumbuhan Terakhir:**
  - Berat badan (kg)
  - Tinggi badan (cm)
  - Tanggal pengukuran terakhir
  
- **Hasil Z-Score WHO:**
  - TB/U (Tinggi Badan per Umur)
  - BB/U (Berat Badan per Umur)
  - BB/TB (Berat Badan per Tinggi Badan)
  - Kategori status gizi otomatis

- **Status Perhatian:**
  - Badge "Normal" (hijau) jika semua Z-Score ≥ -2 SD
  - Badge "Perlu Perhatian" (merah) jika ada Z-Score < -2 SD
  - Badge "Belum Ada Data" (abu-abu) jika belum pernah diperiksa

### 2. **Input Data Pertumbuhan Anak**

Kader dapat menginput data pertumbuhan untuk setiap anak melalui tombol "Input Pertumbuhan":

**Form Input:**
- Tanggal pengukuran
- Berat badan (kg)
- Tinggi badan (cm)

**Auto-calculation:**
- Sistem otomatis menghitung:
  - Umur dalam bulan saat pengukuran
  - Z-Score TB/U, BB/U, BB/TB
  - Kategori status gizi

**Validasi:**
- Input harus valid (angka positif)
- Tanggal tidak boleh di masa depan

### 3. **Input Data Imunisasi**

Kader dapat mencatat jadwal imunisasi melalui tombol "Input Imunisasi":

**Form Input:**
- Nama imunisasi (contoh: BCG, Polio 1, DPT-HB-Hib 1)
- Tanggal pemberian

**Catatan:**
- Mendukung tracking lengkap jadwal imunisasi
- Riwayat imunisasi tersimpan per anak

### 4. **Fitur Pencarian & Filter**

**Pencarian:**
- Cari berdasarkan nama anak
- Cari berdasarkan nama orang tua
- Real-time search (ketik langsung)

**Filter Status:**
- **Semua** - Tampilkan semua anak
- **Normal** - Hanya anak dengan pertumbuhan normal
- **Perlu Perhatian** - Hanya anak dengan Z-Score < -2 SD

### 5. **Melihat Status Gizi**

Kader dapat melihat status gizi setiap anak dengan indikator visual:

**Kategori TB/U (Stunting):**
- ✅ Normal (Z ≥ -2 SD) - Badge hijau
- ⚠️ Stunted (-3 ≤ Z < -2 SD) - Badge kuning
- 🚨 Severely Stunted (Z < -3 SD) - Badge merah

**Kategori BB/U (Underweight):**
- ✅ Normal (Z ≥ -2 SD)
- ⚠️ Underweight (-3 ≤ Z < -2 SD)
- 🚨 Severely Underweight (Z < -3 SD)

**Kategori BB/TB (Wasting):**
- ✅ Normal (-2 ≤ Z ≤ +2 SD)
- ⚠️ Wasted (-3 ≤ Z < -2 SD)
- 🚨 Severely Wasted (Z < -3 SD)
- ⚠️ Overweight (Z > +2 SD)

### 6. **Rekap Data per Bulan**

Dashboard menampilkan rekap bulanan otomatis dengan data:

**Rekap Bulan Berjalan:**
- Total anak di wilayah
- Total pemeriksaan bulan ini
- Jumlah anak dengan status normal
- Jumlah anak stunted (ringan + berat)
- Jumlah anak underweight
- Jumlah anak wasted
- Alert jika ada kasus stunting

**Riwayat 6 Bulan Terakhir:**
- Rekap setiap bulan dalam 6 bulan terakhir
- Comparison data antar bulan
- Visual cards dengan badges berwarna

**Export Data (Future):**
- Download rekap dalam format PDF/Excel
- Kirim otomatis ke puskesmas

### 7. **Statistik Dashboard**

**4 Stats Cards:**
1. **Total Anak** - Jumlah seluruh anak di wilayah
2. **Pemeriksaan Bulan Ini** - Jumlah pengukuran yang sudah dilakukan
3. **Perlu Perhatian** - Anak dengan Z-Score < -2 SD (highlight merah)
4. **Pertumbuhan Normal** - Persentase anak dengan status normal

### 8. **Pembatasan Akses (Security)**

**Kader TIDAK DAPAT:**
- ❌ Menghapus akun orang tua
- ❌ Mengubah data pribadi orang tua
- ❌ Melihat password atau data sensitif
- ❌ Mengakses data anak di luar wilayahnya

**Kader DAPAT:**
- ✅ Melihat semua anak di wilayahnya
- ✅ Input data pertumbuhan & imunisasi
- ✅ Melihat riwayat pertumbuhan
- ✅ Generate rekap bulanan
- ✅ Identifikasi anak yang perlu perhatian khusus

---

## 🏗️ Arsitektur Teknis

### Service Layer

**`app/db/services/cadre.service.ts`**

Fungsi utama:
- `getAnakByWilayah(wilayahId)` - Ambil semua anak di wilayah dengan info parent & data terakhir
- `getCadreStats(wilayahId)` - Hitung statistik dashboard
- `getMonthlyRecap(wilayahId, month, year)` - Generate rekap bulan tertentu
- `getRecentMonthlyRecaps(wilayahId)` - Rekap 6 bulan terakhir

### Component Layer

**`app/components/cadre-anak-list.tsx`**
- List view semua anak
- Search & filter functionality
- Dialog untuk input pertumbuhan & imunisasi
- Status badges & Z-Score display

**`app/components/cadre-monthly-recap.tsx`**
- Current month summary card
- Historical recap cards (6 months)
- Alert notifications untuk kasus stunting
- Visual stats dengan color coding

### Route Layer

**`app/routes/cadre.dashboard.tsx`**
- Loader: Fetch initial data (anak, stats, recaps)
- Auto-refresh setelah input data baru
- Integration semua komponen

---

## 📊 User Flow

### Flow 1: Input Data Pertumbuhan

```
1. Kader login → Dashboard
2. Lihat daftar anak
3. Pilih anak → Klik "Input Pertumbuhan"
4. Isi form (tanggal, BB, TB)
5. Submit → Z-Score auto-calculated
6. Dashboard refresh otomatis
7. Stats & rekap terupdate
```

### Flow 2: Identifikasi Anak Bermasalah

```
1. Dashboard → Lihat stats "Perlu Perhatian"
2. Klik filter "Perlu Perhatian"
3. Lihat daftar anak dengan badge merah
4. Review Z-Score detail
5. Ambil tindakan (rujuk ke puskesmas, edukasi orang tua)
```

### Flow 3: Generate Rekap Bulanan

```
1. Dashboard → Scroll ke "Rekap Data Bulanan"
2. Review rekap bulan berjalan
3. Lihat riwayat 6 bulan
4. Identifikasi trend (naik/turun kasus stunting)
5. Export data (future feature)
```

---

## 🔒 Security & Authorization

### Role-Based Access Control (RBAC)

**Loader Check:**
```typescript
export async function loader() {
  const session = getSession();
  
  // Must be authenticated
  if (!session) return redirect("/login");
  
  // Must have kader role
  if (session.role !== "kader") return redirect("/login");
  
  // Must have wilayah assigned
  if (!session.wilayah_id) throw new Error("No wilayah");
  
  // Load data only from assigned wilayah
  const data = await cadreService.getAnakByWilayah(session.wilayah_id);
  
  return { data };
}
```

### Database-Level Security (RLS)

**Supabase Policies:**
- Kader dapat READ anak di wilayahnya
- Kader dapat CREATE pertumbuhan & imunisasi
- Kader TIDAK dapat DELETE users
- Kader TIDAK dapat UPDATE user credentials

---

## 📱 Responsive Design

**Desktop (≥1024px):**
- 4-column stats grid
- 3-column anak cards
- Full-width tables

**Tablet (768px - 1023px):**
- 2-column stats grid
- 2-column anak cards
- Horizontal scroll tables

**Mobile (<768px):**
- 2-column stats grid
- 1-column anak cards
- Stacked forms
- Touch-optimized buttons

---

## 🎯 Key Features Summary

✅ **View children in assigned area** - with full info & latest growth data  
✅ **Input growth measurements** - auto-calculate Z-Score  
✅ **Input immunization records** - complete tracking  
✅ **View nutritional status** - color-coded WHO categories  
✅ **Monthly statistics** - current + 6 months history  
✅ **Search & filter** - by name or status  
✅ **Alert notifications** - for Z-Score < -2 SD  
✅ **Dashboard statistics** - total children, screenings, % normal  
✅ **Secure access** - role-based, wilayah-scoped  
❌ **Cannot delete parents** - security restriction  

---

## 📚 Related Documentation

- **Z-Score Calculation:** `app/db/utils/README_ZSCORE.md`
- **Parent Features:** `PARENT_FEATURES.md`
- **Database Schema:** `SETUP_DATABASE.md`
- **Z-Score Feature Summary:** `ZSCORE_FEATURE_SUMMARY.md`

---

## 🚀 Future Enhancements

**Planned Features:**
- Export rekap ke PDF/Excel
- Kirim notifikasi ke orang tua via email/SMS
- Calendar view jadwal posyandu
- Bulk import data dari Excel
- Grafik trend stunting (line chart)
- Integration dengan sistem puskesmas
- Mobile app untuk kader (offline-first)

**Performance Optimizations:**
- Pagination untuk list anak (>100 records)
- Virtual scrolling untuk large datasets
- Caching rekap bulanan
- Background job untuk generate reports

---

**Last Updated:** February 18, 2026  
**Version:** 1.0.0
