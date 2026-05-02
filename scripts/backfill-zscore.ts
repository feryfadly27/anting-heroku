import { PrismaClient } from "@prisma/client";
import { pertumbuhanService } from "../app/db/services/pertumbuhan.service";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.pertumbuhan.findMany({
    select: {
      id: true,
      berat_badan: true,
      tinggi_badan: true,
      tanggal_pengukuran: true,
    },
    orderBy: { created_at: "asc" },
  });

  if (rows.length === 0) {
    console.log("No pertumbuhan data to backfill.");
    return;
  }

  let updated = 0;
  for (const row of rows) {
    await pertumbuhanService.updatePertumbuhan(row.id, {
      berat_badan: row.berat_badan,
      tinggi_badan: row.tinggi_badan,
      tanggal_pengukuran: row.tanggal_pengukuran,
    });
    updated++;
  }

  console.log(`Backfilled z-score for ${updated} records.`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
