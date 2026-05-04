/**
 * Teks merek untuk pengguna akhir (UI, meta, manifest).
 * Nama proyek/repo/internal dapat tetap merujuk ke "Anting"; tidak mengubah route atau domain data.
 */
export const BRAND_DISPLAY_NAME = "Diari";

export const BRAND_TAGLINE = "Data Informasi Anak Responsif & Terintegrasi";

/** Paragraf pengantar panjang (landing & dokumentasi pengguna). */
export const BRAND_DESCRIPTION_LONG =
  "Diari adalah sistem informasi kesehatan anak berbasis digital yang dirancang untuk mendukung pemantauan tumbuh kembang anak secara menyeluruh, real-time, dan terintegrasi antara orang tua, kader posyandu, dan tenaga kesehatan. Aplikasi ini hadir sebagai solusi transformasi digital dalam upaya pencegahan dan penanggulangan masalah gizi pada anak, khususnya stunting, wasting, dan gangguan perkembangan lainnya.";

/** Untuk meta description singkat (SEO / snippet). */
export const BRAND_META_DESCRIPTION_SHORT =
  "Sistem informasi kesehatan anak digital: pemantauan tumbuh kembang terintegrasi antara orang tua, kader posyandu, dan tenaga kesehatan.";

export const BRAND_HOME_DOCUMENT_TITLE = `${BRAND_DISPLAY_NAME} — ${BRAND_TAGLINE}`;

/** Judul tab browser: "JudulHalaman - Diari" */
export function brandPageTitle(pageTitle: string): string {
  return `${pageTitle} - ${BRAND_DISPLAY_NAME}`;
}
