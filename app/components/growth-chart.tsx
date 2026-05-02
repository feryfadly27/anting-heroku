import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card/card";
import type { GrowthTrend } from "~/db/services/dashboard.service";
import styles from "./growth-chart.module.css";

interface GrowthChartProps {
  data: GrowthTrend[];
  title: string;
}

export function GrowthChart({ data, title }: GrowthChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.noData}>Belum ada data untuk menampilkan grafik</div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    tanggal: new Date(item.tanggal).toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
    "Berat Badan (kg)": item.beratBadan,
    "Tinggi Badan (cm)": item.tinggiBadan,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-6)" />
            <XAxis dataKey="tanggal" stroke="var(--color-neutral-9)" fontSize={12} />
            <YAxis stroke="var(--color-neutral-9)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-neutral-2)",
                border: "1px solid var(--color-neutral-6)",
                borderRadius: "var(--radius-2)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Berat Badan (kg)"
              stroke="var(--color-accent-9)"
              strokeWidth={2}
              dot={{ fill: "var(--color-accent-9)", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Tinggi Badan (cm)"
              stroke="var(--color-success-9)"
              strokeWidth={2}
              dot={{ fill: "var(--color-success-9)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ZScoreChartProps {
  data: GrowthTrend[];
  title: string;
}

export function ZScoreChart({ data, title }: ZScoreChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.noData}>Belum ada data untuk menampilkan grafik</div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    tanggal: new Date(item.tanggal).toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
    "TB/U": item.zscore_tbu,
    "BB/U": item.zscore_bbu,
    "BB/TB": item.zscore_bbtb,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-6)" />
            <XAxis dataKey="tanggal" stroke="var(--color-neutral-9)" fontSize={12} />
            <YAxis stroke="var(--color-neutral-9)" fontSize={12} domain={[-4, 3]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-neutral-2)",
                border: "1px solid var(--color-neutral-6)",
                borderRadius: "var(--radius-2)",
              }}
            />
            <Legend />
            {/* Reference lines for Z-Score thresholds */}
            <Line type="monotone" dataKey="TB/U" stroke="var(--color-accent-9)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="BB/U" stroke="var(--color-success-9)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="BB/TB" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            {/* Reference line at -2 SD */}
            <Line
              type="monotone"
              dataKey={() => -2}
              stroke="var(--color-error-9)"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              legendType="none"
            />
            {/* Reference line at -3 SD */}
            <Line
              type="monotone"
              dataKey={() => -3}
              stroke="var(--color-error-11)"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              legendType="none"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: "var(--color-error-9)" }}></div>
            <span>Batas -2 SD (Perlu Perhatian)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: "var(--color-error-11)" }}></div>
            <span>Batas -3 SD (Kritis)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
