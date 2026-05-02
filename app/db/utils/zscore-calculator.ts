/**
 * Z-Score Calculator menggunakan metode LMS sesuai WHO 2006
 * 
 * Formula LMS:
 * Jika L ≠ 0: Z = ((X/M)^L - 1) / (L × S)
 * Jika L = 0: Z = ln(X/M) / S
 * 
 * Dimana:
 * - X = nilai pengukuran (berat/tinggi)
 * - L = parameter transformasi Box-Cox
 * - M = median referensi
 * - S = koefisien variasi
 */

export interface LMSParameters {
  l: number; // Lambda (Box-Cox transformation)
  m: number; // Median
  s: number; // Coefficient of variation
}

export interface ZScoreResult {
  zscore: number;
  kategori: string;
}

/**
 * Hitung Z-Score menggunakan metode LMS
 */
export function calculateZScore(
  measuredValue: number,
  lms: LMSParameters
): number {
  const { l, m, s } = lms;
  
  // Validasi input
  if (measuredValue <= 0 || m <= 0 || s <= 0) {
    throw new Error('Invalid parameters: all values must be positive');
  }
  
  let zscore: number;
  
  if (Math.abs(l) < 0.00001) {
    // Jika L ≈ 0, gunakan formula logaritmik
    zscore = Math.log(measuredValue / m) / s;
  } else {
    // Jika L ≠ 0, gunakan formula Box-Cox
    zscore = (Math.pow(measuredValue / m, l) - 1) / (l * s);
  }
  
  // Round ke 2 desimal
  return Math.round(zscore * 100) / 100;
}

/**
 * Kategorisasi TB/U (Tinggi Badan per Umur)
 * Berdasarkan WHO 2006 standards
 */
export function kategorikanTBU(zscore: number): string {
  if (zscore >= -2) {
    return 'Normal';
  } else if (zscore >= -3 && zscore < -2) {
    return 'Stunted';
  } else {
    return 'Severely Stunted';
  }
}

/**
 * Kategorisasi BB/U (Berat Badan per Umur)
 * Berdasarkan WHO 2006 standards
 */
export function kategorikanBBU(zscore: number): string {
  if (zscore >= -2) {
    return 'Normal';
  } else if (zscore >= -3 && zscore < -2) {
    return 'Underweight';
  } else {
    return 'Severely Underweight';
  }
}

/**
 * Kategorisasi BB/TB (Berat Badan per Tinggi Badan)
 * Berdasarkan WHO 2006 standards
 */
export function kategorikanBBTB(zscore: number): string {
  if (zscore > 2) {
    return 'Overweight';
  } else if (zscore > 1 && zscore <= 2) {
    return 'Possible risk of overweight';
  } else if (zscore >= -2 && zscore <= 1) {
    return 'Normal';
  } else if (zscore >= -3 && zscore < -2) {
    return 'Wasted';
  } else {
    return 'Severely Wasted';
  }
}

/**
 * Hitung umur dalam bulan dari tanggal lahir dan tanggal pengukuran
 */
export function hitungUmurBulan(
  tanggalLahir: string | Date,
  tanggalPengukuran: string | Date
): number {
  const lahir = new Date(tanggalLahir);
  const ukur = new Date(tanggalPengukuran);
  
  const tahunDiff = ukur.getFullYear() - lahir.getFullYear();
  const bulanDiff = ukur.getMonth() - lahir.getMonth();
  
  return tahunDiff * 12 + bulanDiff;
}

/**
 * Interpolasi linear untuk mendapatkan nilai LMS pada umur tertentu
 * Digunakan jika data referensi tidak tersedia untuk umur yang tepat
 */
export function interpolateLMS(
  umurBulan: number,
  lmsBefore: { umur_bulan: number } & LMSParameters,
  lmsAfter: { umur_bulan: number } & LMSParameters
): LMSParameters {
  const ratio = (umurBulan - lmsBefore.umur_bulan) / 
                (lmsAfter.umur_bulan - lmsBefore.umur_bulan);
  
  return {
    l: lmsBefore.l + ratio * (lmsAfter.l - lmsBefore.l),
    m: lmsBefore.m + ratio * (lmsAfter.m - lmsBefore.m),
    s: lmsBefore.s + ratio * (lmsAfter.s - lmsBefore.s),
  };
}
