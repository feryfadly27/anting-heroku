import type { ExportData } from "~/db/services/puskesmas.service";

/**
 * Export data as CSV format
 */
export function exportToCSV(data: ExportData): void {
  const timestamp = new Date(data.timestamp).toLocaleString("id-ID");
  
  let csv = "LAPORAN PUSKESMAS - SI BANTING\n";
  csv += `Tanggal Export: ${timestamp}\n\n`;

  // Overall Stats
  csv += "STATISTIK UMUM\n";
  csv += "Kategori,Nilai\n";
  csv += `Total Balita,${data.stats.totalBalita}\n`;
  csv += `Total Kader,${data.stats.totalKader}\n`;
  csv += `Total Wilayah,${data.stats.totalWilayah}\n`;
  csv += `Kasus Stunting,${data.stats.stuntingCount}\n`;
  csv += `Kasus Underweight,${data.stats.underweightCount}\n`;
  csv += `Kasus Wasted,${data.stats.wastedCount}\n`;
  csv += `Balita Normal,${data.stats.normalCount}\n`;
  csv += `Prevalensi Stunting,${data.stats.prevalensiStunting.toFixed(2)}%\n`;
  csv += `Cakupan Pemeriksaan,${data.stats.cakupanPemeriksaan.toFixed(2)}%\n\n`;

  // Wilayah Stats
  csv += "STATISTIK PER WILAYAH\n";
  csv += "Nama Wilayah,Total Balita,Kasus Stunting,Prevalensi (%)\n";
  data.wilayahStats.forEach((w) => {
    csv += `${w.nama_wilayah},${w.totalBalita},${w.stuntingCount},${w.prevalensi.toFixed(2)}\n`;
  });
  csv += "\n";

  // Monthly Prevalensi
  csv += "TREND PREVALENSI BULANAN\n";
  csv += "Bulan,Total Pemeriksaan,Kasus Stunting,Prevalensi (%)\n";
  data.monthlyPrevalensi.forEach((m) => {
    csv += `${m.month},${m.totalPemeriksaan},${m.stuntingCount},${m.prevalensi.toFixed(2)}\n`;
  });
  csv += "\n";

  // Kader List
  csv += "DAFTAR KADER\n";
  csv += "Nama,Email,Wilayah,Total Balita,Total Pemeriksaan\n";
  data.kaders.forEach((k) => {
    csv += `${k.name},${k.email},${k.wilayah_name || "-"},${k.totalBalita},${k.totalPemeriksaan}\n`;
  });

  // Download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `laporan-puskesmas-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as JSON format
 */
export function exportToJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `laporan-puskesmas-${Date.now()}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print-friendly format (opens in new window for PDF print)
 */
export function exportToPDF(data: ExportData): void {
  const timestamp = new Date(data.timestamp).toLocaleString("id-ID");
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Puskesmas - Anting</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          text-align: center;
          color: #333;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        h2 {
          color: #555;
          margin-top: 30px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }
        .timestamp {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
        }
        .stat-label {
          font-weight: bold;
          color: #555;
        }
        .stat-value {
          font-size: 1.5em;
          color: #333;
          margin-top: 5px;
        }
        .alert {
          color: #d32f2f;
          font-weight: bold;
        }
        @media print {
          body {
            padding: 0;
          }
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>LAPORAN PUSKESMAS - SI BANTING</h1>
      <p class="timestamp">Tanggal Export: ${timestamp}</p>

      <h2>Statistik Umum</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Balita</div>
          <div class="stat-value">${data.stats.totalBalita}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Kader</div>
          <div class="stat-value">${data.stats.totalKader}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Wilayah</div>
          <div class="stat-value">${data.stats.totalWilayah}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Kasus Stunting</div>
          <div class="stat-value alert">${data.stats.stuntingCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Prevalensi Stunting</div>
          <div class="stat-value ${data.stats.prevalensiStunting >= 20 ? "alert" : ""}">${data.stats.prevalensiStunting.toFixed(2)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Cakupan Pemeriksaan</div>
          <div class="stat-value">${data.stats.cakupanPemeriksaan.toFixed(2)}%</div>
        </div>
      </div>

      <h2>Statistik per Wilayah</h2>
      <table>
        <thead>
          <tr>
            <th>Nama Wilayah</th>
            <th>Total Balita</th>
            <th>Kasus Stunting</th>
            <th>Prevalensi (%)</th>
          </tr>
        </thead>
        <tbody>
          ${data.wilayahStats
            .map(
              (w) => `
            <tr>
              <td>${w.nama_wilayah}</td>
              <td>${w.totalBalita}</td>
              <td class="${w.stuntingCount > 0 ? "alert" : ""}">${w.stuntingCount}</td>
              <td class="${w.prevalensi >= 20 ? "alert" : ""}">${w.prevalensi.toFixed(2)}%</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <h2>Trend Prevalensi Bulanan</h2>
      <table>
        <thead>
          <tr>
            <th>Bulan</th>
            <th>Total Pemeriksaan</th>
            <th>Kasus Stunting</th>
            <th>Prevalensi (%)</th>
          </tr>
        </thead>
        <tbody>
          ${data.monthlyPrevalensi
            .map(
              (m) => `
            <tr>
              <td>${m.month}</td>
              <td>${m.totalPemeriksaan}</td>
              <td>${m.stuntingCount}</td>
              <td>${m.prevalensi.toFixed(2)}%</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <h2>Daftar Kader</h2>
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Wilayah</th>
            <th>Total Balita</th>
            <th>Total Pemeriksaan</th>
          </tr>
        </thead>
        <tbody>
          ${data.kaders
            .map(
              (k) => `
            <tr>
              <td>${k.name}</td>
              <td>${k.email}</td>
              <td>${k.wilayah_name || "-"}</td>
              <td>${k.totalBalita}</td>
              <td>${k.totalPemeriksaan}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
