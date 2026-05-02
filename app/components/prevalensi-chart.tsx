import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import styles from "./prevalensi-chart.module.css";
import type { MonthlyPrevalensi, WilayahStats } from "~/db/services/puskesmas.service";

interface PrevalensiChartProps {
  monthlyData: MonthlyPrevalensi[];
  wilayahData: WilayahStats[];
}

export function PrevalensiChart({ monthlyData, wilayahData }: PrevalensiChartProps) {
  // Format month names
  const formattedMonthlyData = monthlyData.map((item) => ({
    ...item,
    monthName: formatMonth(item.month),
  }));

  // Format wilayah data for chart
  const formattedWilayahData = wilayahData
    .map((item) => ({
      wilayah: item.nama_wilayah.length > 15 ? item.nama_wilayah.substring(0, 12) + "..." : item.nama_wilayah,
      prevalensi: Number(item.prevalensi.toFixed(1)),
      stunting: item.stuntingCount,
      total: item.totalBalita,
    }))
    .sort((a, b) => b.prevalensi - a.prevalensi)
    .slice(0, 10); // Top 10 wilayah

  return (
    <div className={styles.chartsContainer}>
      {/* Trend Prevalensi per Bulan */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Trend Prevalensi Stunting (6 Bulan Terakhir)</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-6)" />
              <XAxis dataKey="monthName" stroke="var(--color-neutral-11)" style={{ fontSize: "0.875rem" }} />
              <YAxis
                stroke="var(--color-neutral-11)"
                style={{ fontSize: "0.875rem" }}
                label={{ value: "Prevalensi (%)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-neutral-2)",
                  border: "1px solid var(--color-neutral-6)",
                  borderRadius: "var(--radius-2)",
                }}
                labelStyle={{ color: "var(--color-neutral-12)" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="prevalensi"
                stroke="var(--color-error-9)"
                strokeWidth={2}
                name="Prevalensi (%)"
                dot={{ fill: "var(--color-error-9)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prevalensi per Wilayah */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Prevalensi Stunting per Wilayah (Top 10)</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedWilayahData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-6)" />
              <XAxis
                type="number"
                stroke="var(--color-neutral-11)"
                style={{ fontSize: "0.875rem" }}
                label={{ value: "Prevalensi (%)", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                type="category"
                dataKey="wilayah"
                stroke="var(--color-neutral-11)"
                style={{ fontSize: "0.75rem" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-neutral-2)",
                  border: "1px solid var(--color-neutral-6)",
                  borderRadius: "var(--radius-2)",
                }}
                labelStyle={{ color: "var(--color-neutral-12)" }}
              />
              <Legend />
              <Bar dataKey="prevalensi" fill="var(--color-error-9)" name="Prevalensi (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Ringkasan Data per Wilayah</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.summaryTable}>
            <thead>
              <tr>
                <th>Wilayah</th>
                <th>Total Balita</th>
                <th>Stunting</th>
                <th>Prevalensi</th>
              </tr>
            </thead>
            <tbody>
              {wilayahData
                .sort((a, b) => b.prevalensi - a.prevalensi)
                .slice(0, 10)
                .map((item) => (
                  <tr key={item.wilayah_id}>
                    <td>{item.nama_wilayah}</td>
                    <td>{item.totalBalita}</td>
                    <td className={item.stuntingCount > 0 ? styles.alertCell : ""}>{item.stuntingCount}</td>
                    <td>
                      <span className={item.prevalensi >= 20 ? styles.highPrevalensi : styles.normalPrevalensi}>
                        {item.prevalensi.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${months[parseInt(monthNum) - 1]} ${year}`;
}
