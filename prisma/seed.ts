import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = fileURLToPath(new URL(".", import.meta.url));

type Gender = "laki_laki" | "perempuan";
type Indicator = "TB/U" | "BB/U" | "BB/TB";

type WhoSeedRow = {
  jenis_kelamin: Gender;
  umur_bulan: number;
  indikator: Indicator;
  tinggi_cm?: number | null;
  l: number;
  m: number;
  s: number;
};

function parseCdcWhoCsv(fileName: string, gender: Gender, indicator: Indicator): WhoSeedRow[] {
  const csv = readFileSync(join(__dirname, "who-reference", fileName), "utf-8");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const out: WhoSeedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 4) continue;
    const axis = Number(cols[0]);
    const l = Number(cols[1]);
    const m = Number(cols[2]);
    const s = Number(cols[3]);

    if (!Number.isFinite(axis) || !Number.isFinite(l) || !Number.isFinite(m) || !Number.isFinite(s)) continue;

    if (indicator === "BB/TB") {
      out.push({
        jenis_kelamin: gender,
        umur_bulan: 0,
        indikator: indicator,
        tinggi_cm: axis,
        l,
        m,
        s,
      });
      continue;
    }

    out.push({
      jenis_kelamin: gender,
      umur_bulan: axis,
      indikator: indicator,
      tinggi_cm: null,
      l,
      m,
      s,
    });
  }

  return out;
}

function parseWhoAgeDaysCsv(fileName: string, gender: Gender, indicator: "TB/U" | "BB/U"): WhoSeedRow[] {
  const csv = readFileSync(join(__dirname, "who-reference", fileName), "utf-8");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const out: WhoSeedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 4) continue;
    const ageDays = Number(cols[0]);
    const l = Number(cols[1]);
    const m = Number(cols[2]);
    const s = Number(cols[3]);
    if (!Number.isFinite(ageDays) || !Number.isFinite(l) || !Number.isFinite(m) || !Number.isFinite(s)) continue;
    out.push({
      jenis_kelamin: gender,
      umur_bulan: Math.round(ageDays),
      indikator: indicator,
      tinggi_cm: null,
      l,
      m,
      s,
    });
  }

  return out;
}

function parseWhoWeightByLengthHeightCsv(
  fileName: string,
  gender: Gender,
  ageTag: 24 | 25
): WhoSeedRow[] {
  const csv = readFileSync(join(__dirname, "who-reference", fileName), "utf-8");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const out: WhoSeedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 4) continue;
    const height = Number(cols[0]);
    const l = Number(cols[1]);
    const m = Number(cols[2]);
    const s = Number(cols[3]);
    if (!Number.isFinite(height) || !Number.isFinite(l) || !Number.isFinite(m) || !Number.isFinite(s)) continue;
    out.push({
      jenis_kelamin: gender,
      umur_bulan: ageTag,
      indikator: "BB/TB",
      tinggi_cm: height,
      l,
      m,
      s,
    });
  }

  return out;
}

function summarizeWhoRows(rows: WhoSeedRow[]) {
  const byKey = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.indikator}-${row.jenis_kelamin}`;
    byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }
  for (const [key, count] of byKey.entries()) {
    console.log(`   - ${key}: ${count} rows`);
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  // 0. Seed WHO reference data (official CSV published by CDC/WHO).
  const whoData: WhoSeedRow[] = [
    ...parseWhoAgeDaysCsv("lhfa_boys_0_5.csv", "laki_laki", "TB/U"),
    ...parseWhoAgeDaysCsv("lhfa_girls_0_5.csv", "perempuan", "TB/U"),
    ...parseWhoAgeDaysCsv("wfa_boys_0_5.csv", "laki_laki", "BB/U"),
    ...parseWhoAgeDaysCsv("wfa_girls_0_5.csv", "perempuan", "BB/U"),
    ...parseWhoWeightByLengthHeightCsv("wfl_boys_0_2.csv", "laki_laki", 24),
    ...parseWhoWeightByLengthHeightCsv("wfl_girls_0_2.csv", "perempuan", 24),
    ...parseWhoWeightByLengthHeightCsv("wfh_boys_2_5.csv", "laki_laki", 25),
    ...parseWhoWeightByLengthHeightCsv("wfh_girls_2_5.csv", "perempuan", 25),
  ];

  await prisma.whoReference.deleteMany();
  await prisma.whoReference.createMany({ data: whoData });
  console.log(`✅ WHO reference seeded (${whoData.length} rows).`);
  summarizeWhoRows(whoData);

  // 1. Seed Wilayah
  const wilayahIds = {
    puskesmas: "puskesmas-id-1",
    desa1: "desa-id-1",
    desa2: "desa-id-2",
    desa3: "desa-id-3",
    kelurahan1: "kelurahan-id-1",
    kelurahan2: "kelurahan-id-2",
  };

  await prisma.wilayah.upsert({
    where: { id: wilayahIds.puskesmas },
    update: {},
    create: {
      id: wilayahIds.puskesmas,
      nama_wilayah: "Puskesmas Banting",
      tipe: "puskesmas",
    },
  });

  await prisma.wilayah.upsert({
    where: { id: wilayahIds.desa1 },
    update: {},
    create: {
      id: wilayahIds.desa1,
      nama_wilayah: "Desa Banting Kidul",
      tipe: "desa",
    },
  });

  await prisma.wilayah.upsert({
    where: { id: wilayahIds.desa2 },
    update: {},
    create: {
      id: wilayahIds.desa2,
      nama_wilayah: "Desa Banting Utara",
      tipe: "desa",
    },
  });

  await prisma.wilayah.upsert({
    where: { id: wilayahIds.desa3 },
    update: {},
    create: {
      id: wilayahIds.desa3,
      nama_wilayah: "Desa Banting Timur",
      tipe: "desa",
    },
  });

  await prisma.wilayah.upsert({
    where: { id: wilayahIds.kelurahan1 },
    update: {},
    create: {
      id: wilayahIds.kelurahan1,
      nama_wilayah: "Kelurahan Banting Barat",
      tipe: "kelurahan",
    },
  });

  await prisma.wilayah.upsert({
    where: { id: wilayahIds.kelurahan2 },
    update: {},
    create: {
      id: wilayahIds.kelurahan2,
      nama_wilayah: "Kelurahan Banting Tengah",
      tipe: "kelurahan",
    },
  });

  console.log("✅ Wilayah seeded.");

  // 2. Seed Users
  const users = [
    {
      name: "Admin Puskesmas",
      email: "budi@puskesmas.com",
      password: "puskesmas123", // In prod, use bcrypt!
      role: "puskesmas",
      wilayah_id: wilayahIds.puskesmas,
    },
    {
      name: "Kader Aminah",
      email: "aminah@cadre.com",
      password: "cadre123",
      role: "kader",
      wilayah_id: wilayahIds.desa1,
    },
    {
      name: "Siti (Orang Tua)",
      email: "siti@parent.com",
      password: "parent123",
      role: "orang_tua",
      wilayah_id: wilayahIds.desa1,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user as any,
    });
  }

  console.log("✅ Users seeded.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
