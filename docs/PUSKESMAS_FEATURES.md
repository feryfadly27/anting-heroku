# Fitur Dashboard Puskesmas

## Overview

Dashboard Puskesmas adalah interface lengkap untuk level puskesmas dalam sistem SI Banting. Dashboard ini menyediakan visualisasi data agregat, analisis prevalensi stunting, manajemen kader, dan fitur export laporan.

---

## 🎯 Fitur Utama

### 1. **Statistik Agregat Puskesmas**

Dashboard menampilkan 6 metrics utama:

#### Stats Cards

- **Total Balita**: Jumlah total balita terdaftar di seluruh wilayah
- **Wilayah Kerja**: Jumlah wilayah (desa/kelurahan) yang dikelola
- **Total Kader**: Jumlah kader posyandu aktif
- **Kasus Stunting**: Jumlah balita dengan Z-Score TB/U < -2 SD (highlight merah)
- **Prevalensi Stunting**: Persentase kasus stunting dari total balita
- **Cakupan Pemeriksaan**: Persentase balita yang sudah memiliki data pertumbuhan

#### Visual Indicators

- Card merah untuk "Kasus Stunting" jika > 0
- Hover effects untuk interaktivitas
- Responsive grid layout

---

### 2. **Grafik Prevalensi Stunting**

#### A. Trend Prevalensi per Bulan (Line Chart)

- Menampilkan 6 bulan terakhir
- X-axis: Bulan (format: Jan 2024, Feb 2024, dst)
- Y-axis: Prevalensi (%)
- Line color: Merah (error color)
- Interactive tooltips dengan detail data

#### B. Prevalensi per Wilayah (Bar Chart)

- Top 10 wilayah dengan prevalensi tertinggi
- Horizontal bar chart untuk readability
- X-axis: Prevalensi (%)
- Y-axis: Nama wilayah (truncated jika panjang)
- Sorted descending by prevalensi

#### C. Tabel Ringkasan per Wilayah

Tabel lengkap dengan kolom:
- Nama Wilayah
- Total Balita
- Kasus Stunting (merah jika > 0)
- Prevalensi (%)
  - Badge merah: prevalensi ≥ 20% (tinggi)
  - Badge hijau: prevalensi < 20% (normal)

---

### 3. **Filter Berdasarkan Wilayah**

#### Filter Control

- Dropdown "Filter Wilayah" di atas grafik
- Options:
  - "Semua Wilayah" (default)
  - List semua wilayah dari database
- Real-time filtering
- Auto-reload data saat wilayah berubah

#### Filtered Data

Saat wilayah dipilih:
- Stats cards tetap menampilkan data global
- Grafik dan tabel hanya menampilkan data wilayah terpilih
- Filter persists selama session

---

### 4. **Manajemen Akun Kader**

#### Daftar Kader (Grid View)

Setiap kartu kader menampilkan:
- Nama lengkap
- Email
- Wilayah binaan (dengan icon MapPin)
- Total balita di wilayah
- Total pemeriksaan yang dilakukan
- Action buttons (Edit, Delete)

#### Search & Filter

- Search bar untuk cari kader (nama/email/wilayah)
- Real-time filtering saat mengetik
- Empty state jika tidak ada hasil

#### CRUD Operations

**Create Kader:**
- Dialog form dengan fields:
  - Nama Lengkap (required)
  - Email (required, type email)
  - Password (required)
  - Wilayah (required, dropdown)
- Validation sebelum submit
- Auto-refresh list setelah create

**Update Kader:**
- Pre-filled form dengan data existing
- Fields: Nama, Email, Wilayah
- Password tidak bisa diubah (untuk keamanan)
- Auto-refresh setelah update

**Delete Kader:**
- Confirmation dialog dengan nama kader
- Warning: tindakan tidak dapat dibatalkan
- Tidak menghapus data balita (data integrity)

#### Security & Restrictions

Puskesmas **DAPAT**:
- ✅ Melihat semua kader
- ✅ Membuat kader baru
- ✅ Update info kader (nama, email, wilayah)
- ✅ Menghapus kader

Puskesmas **TIDAK DAPAT**:
- ❌ Menghapus akun orang tua (sesuai requirement)
- ❌ Mengubah password kader (hanya saat create)
- ❌ Mengakses data pribadi sensitif

---

### 5. **Export Laporan**

#### Format Export

**A. CSV (Excel-compatible)**
- Header: "LAPORAN PUSKESMAS - SI BANTING"
- Timestamp export
- 4 sections:
  1. Statistik Umum (key-value pairs)
  2. Statistik per Wilayah (tabel)
  3. Trend Prevalensi Bulanan (tabel)
  4. Daftar Kader (tabel)
- UTF-8 encoding untuk kompatibilitas
- Auto-download dengan nama `laporan-puskesmas-{timestamp}.csv`

**B. PDF (Print-friendly)**
- Professional layout dengan CSS styling
- Header dengan logo SI Banting
- Timestamp di top
- Stats grid dengan visual cards
- Tables dengan alternate row colors
- Highlight untuk nilai alert (merah)
- Auto-print dialog saat open
- Dapat save as PDF dari print dialog

**C. JSON (Developer/API)**
- Raw data dalam format JSON
- Complete data structure
- Untuk integrasi dengan sistem lain
- Auto-download dengan nama `laporan-puskesmas-{timestamp}.json`

#### Export Buttons

- 3 tombol di header dashboard:
  - "Export CSV" → download CSV
  - "Export PDF" → open print preview
- Loading state saat export (disabled button)
- Error handling dengan alert

---

## 🏗️ Architecture & Data Flow

### Service Layer (`puskesmas.service.ts`)

**Core Functions:**

1. `getPuskesmasStats()`: Aggregate statistics
2. `getAllWilayah()`: List all regions
3. `getStatsByWilayah(wilayahId?)`: Stats per region with optional filter
4. `getMonthlyPrevalensi(months)`: Trend data for N months
5. `getAllKaders()`: Kader list with stats
6. `createKader()`: Add new kader
7. `updateKader()`: Update kader info
8. `deleteKader()`: Remove kader
9. `getExportData()`: Complete data for export

**Data Aggregation Strategy:**

- Parallel loading dengan `Promise.all` untuk performance
- Smart grouping untuk latest data per anak
- Automatic Z-Score categorization
- Wilayah-scoped queries untuk filtering

### Component Structure

```
PuskesmasDashboard
├── Header (title, actions, export buttons)
├── PuskesmasStatsComponent (6 stats cards)
└── Tabs
    ├── Tab: Analitik & Prevalensi
    │   ├── Filter Section (wilayah dropdown)
    │   └── PrevalensiChart
    │       ├── Line Chart (monthly trend)
    │       ├── Bar Chart (per wilayah)
    │       └── Summary Table
    └── Tab: Manajemen Kader
        └── KaderManagement
            ├── Search Bar
            ├── Create Button
            ├── Kader Grid (cards)
            └── Dialogs (Create/Edit/Delete)
```

### State Management

```typescript
- stats: PuskesmasStats | null
- wilayahList: Wilayah[]
- wilayahStats: WilayahStats[]
- monthlyData: MonthlyPrevalensi[]
- kaders: KaderWithStats[]
- selectedWilayah: string (filter state)
- isLoading: boolean
- isExporting: boolean
```

---

## 📊 Data Models

### PuskesmasStats

```typescript
{
  totalBalita: number
  totalKader: number
  totalWilayah: number
  stuntingCount: number
  underweightCount: number
  wastedCount: number
  normalCount: number
  prevalensiStunting: number  // percentage
  cakupanPemeriksaan: number  // percentage
}
```

### WilayahStats

```typescript
{
  wilayah_id: string
  nama_wilayah: string
  totalBalita: number
  stuntingCount: number
  prevalensi: number  // percentage
}
```

### MonthlyPrevalensi

```typescript
{
  month: string           // YYYY-MM
  totalPemeriksaan: number
  stuntingCount: number
  prevalensi: number      // percentage
}
```

### KaderWithStats

```typescript
{
  id: string
  name: string
  email: string
  wilayah_id: string | null
  wilayah_name: string | null
  created_at: string
  totalBalita: number
  totalPemeriksaan: number
}
```

---

## 🎨 Visual Design

### Color Coding

- **Normal**: Green (`--color-success-*`)
- **Warning**: Yellow/Orange (prevalensi 10-20%)
- **Alert/Critical**: Red (`--color-error-*`, prevalensi ≥ 20%)
- **Neutral**: Gray for general UI

### Responsive Breakpoints

- **Desktop** (> 1024px): 3-column stats, full-width charts
- **Tablet** (768-1024px): 2-column stats, adapted charts
- **Mobile** (< 768px): 2-column stats, vertical stacking

### Accessibility

- Color contrast compliance
- Keyboard navigation support
- Screen reader friendly labels
- Interactive tooltips

---

## 🚀 Use Cases

### Use Case 1: Monthly Prevalensi Review

**Scenario**: Puskesmas staff wants to review monthly stunting trends

**Steps**:
1. Login → Puskesmas Dashboard
2. Review "Kasus Stunting" stat (check if increased)
3. Click "Analitik & Prevalensi" tab
4. View line chart → identify months with high prevalensi
5. Check bar chart → identify wilayah with highest prevalensi
6. Use filter → select problematic wilayah
7. Review detailed table data
8. Export PDF → share with team

### Use Case 2: Kader Onboarding

**Scenario**: New kader joins, needs account creation

**Steps**:
1. Navigate to "Manajemen Kader" tab
2. Click "Tambah Kader" button
3. Fill form:
   - Nama: "Kader Siti"
   - Email: "siti@posyandu.com"
   - Password: "secure123"
   - Wilayah: Select from dropdown
4. Submit → kader created
5. Kader receives login credentials
6. Kader can now access their dashboard

### Use Case 3: Quarterly Report Generation

**Scenario**: Generate quarterly report for government submission

**Steps**:
1. Review dashboard → ensure data is up-to-date
2. Click "Refresh" if needed
3. Click "Export CSV" → for data processing
4. Click "Export PDF" → for official report
5. Print PDF → sign → submit to authorities
6. Keep CSV → for analysis in Excel

---

## ✅ Requirements Checklist

- ✅ **Statistik jumlah balita**: 6 metrics cards dengan real-time data
- ✅ **Jumlah kasus stunting**: Dedicated stat card dengan highlight merah
- ✅ **Grafik prevalensi**: 2 charts (trend & per wilayah) + tabel
- ✅ **Filter berdasarkan wilayah**: Dropdown filter dengan auto-reload
- ✅ **Export laporan**: 3 formats (CSV, PDF, JSON)
- ✅ **Manajemen akun kader**: Full CRUD dengan search & validation
- ✅ **Tidak bisa menghapus akun orang tua**: Puskesmas hanya manage kader

---

## 📁 Files Created

**Services**:
- `app/db/services/puskesmas.service.ts`

**Components**:
- `app/components/puskesmas-stats.tsx`
- `app/components/puskesmas-stats.module.css`
- `app/components/prevalensi-chart.tsx`
- `app/components/prevalensi-chart.module.css`
- `app/components/kader-management.tsx`
- `app/components/kader-management.module.css`

**Utils**:
- `app/utils/export.ts`

**Routes**:
- `app/routes/puskesmas.dashboard.tsx` (updated)
- `app/routes/puskesmas.dashboard.module.css` (updated)

**Documentation**:
- `PUSKESMAS_FEATURES.md`

---

## 🔮 Future Enhancements

**Potential additions** (not in current scope):

1. **Advanced Filters**:
   - Multi-select wilayah
   - Date range selector
   - Gender filter
   - Age range filter

2. **Additional Charts**:
   - Pie chart for category distribution
   - Heatmap for wilayah comparison
   - Growth curve comparisons

3. **Notifications**:
   - Email alerts for high prevalensi
   - Weekly digest reports
   - Real-time dashboard updates

4. **Kader Performance**:
   - Ranking by pemeriksaan count
   - Activity timeline
   - Performance badges

5. **Integration**:
   - API endpoints for external systems
   - Webhook notifications
   - Automated report scheduling

---

## 🛡️ Security Considerations

- Role-based access control (RBAC)
- Password hashing (production requirement)
- SQL injection prevention (Supabase handles this)
- XSS prevention (React escapes by default)
- CSRF protection (for mutations)
- Audit logging (future enhancement)

---

## 📞 Support & Maintenance

For issues or enhancements:
1. Check documentation
2. Review error logs in console
3. Verify database connections
4. Contact system administrator

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: SI Banting Development Team
