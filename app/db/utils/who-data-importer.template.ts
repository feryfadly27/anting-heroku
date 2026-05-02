/**
 * Template Script untuk Import Data WHO 2006
 * 
 * File ini adalah template untuk mengimport data lengkap WHO 2006.
 * Data dapat diunduh dari: https://www.who.int/tools/child-growth-standards/standards
 * 
 * Files yang diperlukan:
 * - lhfa_boys_p_exp.txt (Length/Height-for-Age Boys)
 * - lhfa_girls_p_exp.txt (Length/Height-for-Age Girls)
 * - wfa_boys_p_exp.txt (Weight-for-Age Boys)
 * - wfa_girls_p_exp.txt (Weight-for-Age Girls)
 * - wfh_boys_p_exp.txt (Weight-for-Height Boys)
 * - wfh_girls_p_exp.txt (Weight-for-Height Girls)
 */

import { whoReferenceService, type WHOReference } from "../services/who-reference.service";
import type { JenisKelamin } from "../types";

/**
 * Parser untuk format file WHO
 * Format file WHO biasanya: Month/Height, L, M, S, ...
 */
function parseWHOFile(
  fileContent: string,
  jenisKelamin: JenisKelamin,
  indikator: "TB/U" | "BB/U" | "BB/TB"
): Omit<WHOReference, "id">[] {
  const lines = fileContent.split("\n");
  const data: Omit<WHOReference, "id">[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/\s+/);

    // Format berbeda untuk setiap indikator
    if (indikator === "BB/TB") {
      // Format: Height, L, M, S
      const tinggi_cm = parseFloat(parts[0]);
      const l = parseFloat(parts[1]);
      const m = parseFloat(parts[2]);
      const s = parseFloat(parts[3]);

      if (isNaN(tinggi_cm) || isNaN(l) || isNaN(m) || isNaN(s)) continue;

      data.push({
        jenis_kelamin: jenisKelamin,
        umur_bulan: 0, // BB/TB tidak depend pada umur
        indikator,
        tinggi_cm,
        l,
        m,
        s,
      });
    } else {
      // Format: Month, L, M, S
      const umur_bulan = parseInt(parts[0], 10);
      const l = parseFloat(parts[1]);
      const m = parseFloat(parts[2]);
      const s = parseFloat(parts[3]);

      if (isNaN(umur_bulan) || isNaN(l) || isNaN(m) || isNaN(s)) continue;

      data.push({
        jenis_kelamin: jenisKelamin,
        umur_bulan,
        indikator,
        tinggi_cm: null,
        l,
        m,
        s,
      });
    }
  }

  return data;
}

/**
 * Main import function
 * 
 * Usage:
 * 
 * ```typescript
 * import fs from 'fs';
 * 
 * const files = {
 *   lhfa_boys: fs.readFileSync('./who-data/lhfa_boys_p_exp.txt', 'utf-8'),
 *   lhfa_girls: fs.readFileSync('./who-data/lhfa_girls_p_exp.txt', 'utf-8'),
 *   wfa_boys: fs.readFileSync('./who-data/wfa_boys_p_exp.txt', 'utf-8'),
 *   wfa_girls: fs.readFileSync('./who-data/wfa_girls_p_exp.txt', 'utf-8'),
 *   wfh_boys: fs.readFileSync('./who-data/wfh_boys_p_exp.txt', 'utf-8'),
 *   wfh_girls: fs.readFileSync('./who-data/wfh_girls_p_exp.txt', 'utf-8'),
 * };
 * 
 * await importWHOData(files);
 * ```
 */
export async function importWHOData(files: {
  lhfa_boys: string;
  lhfa_girls: string;
  wfa_boys: string;
  wfa_girls: string;
  wfh_boys: string;
  wfh_girls: string;
}) {
  console.log("Starting WHO 2006 data import...");

  // Clear existing data
  console.log("Clearing existing data...");
  await whoReferenceService.clearAllReference();

  const allData: Omit<WHOReference, "id">[] = [];

  // Parse TB/U (Length/Height-for-Age)
  console.log("Parsing TB/U data...");
  allData.push(...parseWHOFile(files.lhfa_boys, "laki_laki", "TB/U"));
  allData.push(...parseWHOFile(files.lhfa_girls, "perempuan", "TB/U"));

  // Parse BB/U (Weight-for-Age)
  console.log("Parsing BB/U data...");
  allData.push(...parseWHOFile(files.wfa_boys, "laki_laki", "BB/U"));
  allData.push(...parseWHOFile(files.wfa_girls, "perempuan", "BB/U"));

  // Parse BB/TB (Weight-for-Height)
  console.log("Parsing BB/TB data...");
  allData.push(...parseWHOFile(files.wfh_boys, "laki_laki", "BB/TB"));
  allData.push(...parseWHOFile(files.wfh_girls, "perempuan", "BB/TB"));

  console.log(`Total records to import: ${allData.length}`);

  // Bulk insert in chunks (Supabase has limits)
  const CHUNK_SIZE = 100;
  for (let i = 0; i < allData.length; i += CHUNK_SIZE) {
    const chunk = allData.slice(i, i + CHUNK_SIZE);
    console.log(`Inserting chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(allData.length / CHUNK_SIZE)}...`);
    await whoReferenceService.bulkInsertReference(chunk);
  }

  console.log("✅ WHO 2006 data import complete!");
  return { imported: allData.length };
}

/**
 * Verify imported data
 */
export async function verifyWHOData() {
  console.log("Verifying WHO data...");

  // Test query untuk setiap jenis
  const tests = [
    { jenis_kelamin: "laki_laki" as const, umur: 12, indikator: "TB/U" as const },
    { jenis_kelamin: "perempuan" as const, umur: 12, indikator: "TB/U" as const },
    { jenis_kelamin: "laki_laki" as const, umur: 12, indikator: "BB/U" as const },
    { jenis_kelamin: "perempuan" as const, umur: 12, indikator: "BB/U" as const },
    { jenis_kelamin: "laki_laki" as const, umur: 12, indikator: "BB/TB" as const, tinggi: 75 },
    { jenis_kelamin: "perempuan" as const, umur: 12, indikator: "BB/TB" as const, tinggi: 74 },
  ];

  for (const test of tests) {
    const lms = await whoReferenceService.getReference(
      test.jenis_kelamin,
      test.umur,
      test.indikator,
      test.tinggi
    );

    if (lms) {
      console.log(`✅ ${test.indikator} ${test.jenis_kelamin} umur ${test.umur}:`, lms);
    } else {
      console.error(`❌ Missing data for ${test.indikator} ${test.jenis_kelamin} umur ${test.umur}`);
    }
  }

  console.log("Verification complete!");
}

/**
 * Example usage in a script file or API endpoint:
 * 
 * ```typescript
 * import { importWHOData, verifyWHOData } from '~/db/utils/who-data-importer';
 * 
 * // Run import (one time only)
 * const result = await importWHOData({
 *   lhfa_boys: fileContent1,
 *   lhfa_girls: fileContent2,
 *   // ... etc
 * });
 * 
 * console.log(`Imported ${result.imported} records`);
 * 
 * // Verify
 * await verifyWHOData();
 * ```
 */
