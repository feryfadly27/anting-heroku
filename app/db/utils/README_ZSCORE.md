# Z-Score Calculator Documentation

## Overview

Sistem perhitungan Z-Score untuk analisis pertumbuhan anak menggunakan metode **LMS (Lambda-Mu-Sigma)** sesuai standar **WHO 2006**.

## Formula LMS

### Jika L ≠ 0 (Box-Cox Transformation)
```
Z = ((X/M)^L - 1) / (L × S)
```

### Jika L ≈ 0 (Logarithmic)
```
Z = ln(X/M) / S
```

Dimana:
- **X**: Nilai pengukuran (berat badan dalam kg atau tinggi badan dalam cm)
- **L**: Parameter transformasi Box-Cox (Lambda)
- **M**: Median referensi (Mu)
- **S**: Koefisien variasi (Sigma)

## Indikator yang Dihitung

### 1. TB/U (Tinggi Badan per Umur / Height-for-Age)
Mengukur pertumbuhan linear anak dan mengidentifikasi stunting.

**Kategori:**
- Z ≥ -2 SD: **Normal**
- -3 SD ≤ Z < -2 SD: **Stunted** (Pendek)
- Z < -3 SD: **Severely Stunted** (Sangat Pendek)

### 2. BB/U (Berat Badan per Umur / Weight-for-Age)
Mengukur status gizi umum anak.

**Kategori:**
- Z ≥ -2 SD: **Normal**
- -3 SD ≤ Z < -2 SD: **Underweight** (Berat Badan Kurang)
- Z < -3 SD: **Severely Underweight** (Sangat Kurus)

### 3. BB/TB (Berat Badan per Tinggi Badan / Weight-for-Height)
Mengidentifikasi wasting (kurus) atau overweight.

**Kategori:**
- Z > 2 SD: **Overweight** (Kelebihan Berat Badan)
- 1 < Z ≤ 2 SD: **Possible risk of overweight**
- -2 SD ≤ Z ≤ 1 SD: **Normal**
- -3 SD ≤ Z < -2 SD: **Wasted** (Kurus)
- Z < -3 SD: **Severely Wasted** (Sangat Kurus)

## Struktur Database

### Tabel: `pertumbuhan`

**Kolom Z-Score yang ditambahkan:**
```sql
zscore_tbu      DECIMAL(5,2)  -- Z-Score TB/U
kategori_tbu    VARCHAR(50)   -- Kategori TB/U
zscore_bbu      DECIMAL(5,2)  -- Z-Score BB/U
kategori_bbu    VARCHAR(50)   -- Kategori BB/U
zscore_bbtb     DECIMAL(5,2)  -- Z-Score BB/TB
kategori_bbtb   VARCHAR(50)   -- Kategori BB/TB
umur_bulan      INTEGER       -- Umur saat pengukuran (bulan)
```

### Tabel: `who_reference`

Menyimpan data referensi WHO 2006 dengan parameter LMS.

**Struktur:**
```sql
id              UUID PRIMARY KEY
jenis_kelamin   jenis_kelamin NOT NULL    -- 'laki_laki' atau 'perempuan'
umur_bulan      INTEGER NOT NULL          -- 0-60 bulan
indikator       VARCHAR(20) NOT NULL      -- 'TB/U', 'BB/U', atau 'BB/TB'
tinggi_cm       DECIMAL(6,2)              -- Untuk referensi BB/TB
l               DECIMAL(10,6) NOT NULL    -- Parameter L
m               DECIMAL(10,6) NOT NULL    -- Parameter M
s               DECIMAL(10,6) NOT NULL    -- Parameter S
```

**Unique Constraint:**
```sql
UNIQUE(jenis_kelamin, umur_bulan, indikator, tinggi_cm)
```

## Penggunaan

### Auto-calculation saat Create

Z-Score dihitung otomatis saat data pertumbuhan baru dibuat:

```typescript
import { pertumbuhanService } from '~/db/services/pertumbuhan.service';

const pertumbuhan = await pertumbuhanService.createPertumbuhan({
  anak_id: 'uuid-anak',
  tanggal_pengukuran: '2025-02-18',
  berat_badan: 12.5,
  tinggi_badan: 85.0
});

// Hasil akan include:
// - zscore_tbu, kategori_tbu
// - zscore_bbu, kategori_bbu
// - zscore_bbtb, kategori_bbtb
// - umur_bulan
```

### Auto-recalculation saat Update

Z-Score dihitung ulang jika berat/tinggi/tanggal berubah:

```typescript
const updated = await pertumbuhanService.updatePertumbuhan(
  'pertumbuhan-id',
  {
    berat_badan: 13.0,
    tinggi_badan: 86.5
  }
);
```

### Manual Calculation

Menggunakan utility function langsung:

```typescript
import { calculateZScore, kategorikanTBU } from '~/db/utils/zscore-calculator';

const lmsParams = { l: 1, m: 85.7, s: 0.0387 };
const tinggiBadan = 82.5; // cm

const zscore = calculateZScore(tinggiBadan, lmsParams);
// Output: -0.82

const kategori = kategorikanTBU(zscore);
// Output: "Normal"
```

## Interpolasi Linear

Jika data referensi tidak tersedia untuk umur yang tepat, sistem melakukan interpolasi linear:

```typescript
import { interpolateLMS } from '~/db/utils/zscore-calculator';

const lmsBefore = { umur_bulan: 12, l: 1, m: 74.02, s: 0.0364 };
const lmsAfter = { umur_bulan: 24, l: 1, m: 85.70, s: 0.0387 };

const lmsInterpolated = interpolateLMS(18, lmsBefore, lmsAfter);
// Output: nilai LMS untuk umur 18 bulan
```

## Data Referensi WHO 2006

### Status: ✅ COMPLETE

Tabel `who_reference` berisi **380 rows** data lengkap WHO 2006:

| Indikator | Jenis Kelamin | Jumlah | Range |
|-----------|--------------|--------|-------|
| TB/U | laki_laki | 61 | 0-60 bulan |
| TB/U | Perempuan | 61 | 0-60 bulan |
| BB/U | laki_laki | 61 | 0-60 bulan |
| BB/U | Perempuan | 61 | 0-60 bulan |
| BB/TB | laki_laki | 68 | 45-110 cm |
| BB/TB | Perempuan | 68 | 45-110 cm |

**Coverage penuh 0-60 bulan** untuk semua indikator umur-based.
**Coverage 45-110 cm** untuk indikator BB/TB (weight-for-height).

### Service API

```typescript
import { whoReferenceService } from '~/db/services/who-reference.service';

// Get TB/U or BB/U reference by age
const lms = await whoReferenceService.getReferenceByAge('laki_laki', 12, 'TB/U');

// Get BB/TB reference by height (with nearest-match interpolation)
const lmsBBTB = await whoReferenceService.getReferenceByHeight('perempuan', 72.5);

// Backward-compatible unified method
const lmsUnified = await whoReferenceService.getReference('laki_laki', 12, 'BB/TB', 75.0);
```

## Error Handling

### Jika Data Referensi Tidak Ada

Service akan return `null` untuk LMS dan Z-Score tidak dihitung:

```typescript
const lms = await whoReferenceService.getReference(
  'laki_laki',
  150, // umur 150 bulan (di luar range)
  'TB/U'
);
// lms = null

// Z-Score akan null di database
```

### Validasi Input

Sistem memvalidasi input sebelum perhitungan:

```typescript
// Throws error jika nilai <= 0
calculateZScore(-1, lms); // Error: Invalid parameters
calculateZScore(50, { l: 1, m: -10, s: 0.03 }); // Error: Invalid parameters
```

## Future Enhancements

1. ~~**Import Full WHO 2006 Dataset**~~ ✅ DONE (380 rows imported)

2. **Grafik Pertumbuhan**
   - Plot Z-Score dari waktu ke waktu
   - Kurva pertumbuhan WHO overlay

3. **Alert System**
   - Notifikasi jika Z-Score < -2 SD
   - Warning untuk orang tua & kader

4. **Extended Age Range**
   - WHO 2007 untuk anak 5-19 tahun
   - Continuous monitoring hingga remaja

5. **Additional Indicators**
   - BMI-for-Age (5-19 tahun)
   - Head Circumference-for-Age (0-5 tahun)

## References

- [WHO Child Growth Standards 2006](https://www.who.int/childgrowth/standards/en/)
- [WHO Anthro Software](https://www.who.int/tools/child-growth-standards/software)
- [LMS Method Paper](https://www.cdc.gov/growthcharts/percentile_data_files.htm)
