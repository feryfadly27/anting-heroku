import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FileDown, Filter, RefreshCw } from "lucide-react";
import type { Route } from "./+types/puskesmas.dashboard";
import styles from "./puskesmas.dashboard.module.css";
import { DashboardLayout } from "~/components/dashboard-layout";
import { Button } from "~/components/ui/button/button";
import { PuskesmasStatsComponent } from "~/components/puskesmas-stats";
import { PrevalensiChart } from "~/components/prevalensi-chart";
import { KaderManagement } from "~/components/kader-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select/select";
import { exportToCSV, exportToPDF } from "~/utils/export";
import { getCurrentUser } from "~/utils/auth";

// Types (use any to avoid importing Prisma-connected modules)
type PuskesmasStats = any;
type Wilayah = any;
type WilayahStats = any;
type MonthlyPrevalensi = any;
type KaderWithStats = any;

// Client-safe API helpers
const puskesmasApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getAll: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard"),
  getStats: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=stats"),
  getWilayah: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=wilayah"),
  getWilayahStats: (filter?: string) => puskesmasApi.fetchWithError(`/api/puskesmas/dashboard?action=wilayah-stats${filter ? `&filter=${filter}` : ''}`),
  getMonthly: (months = 6) => puskesmasApi.fetchWithError(`/api/puskesmas/dashboard?action=monthly&months=${months}`),
  getKaders: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=kaders"),
  getExport: () => puskesmasApi.fetchWithError("/api/puskesmas/dashboard?action=export"),
  submitAction: (formData: FormData) => puskesmasApi.fetchWithError("/api/puskesmas/dashboard", { method: "POST", body: formData }),
};

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dashboard Puskesmas - Anting" },
    {
      name: "description",
      content: "Dashboard untuk Puskesmas di Anting",
    },
  ];
}

export default function PuskesmasDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PuskesmasStats | null>(null);
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [wilayahStats, setWilayahStats] = useState<WilayahStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPrevalensi[]>([]);
  const [kaders, setKaders] = useState<KaderWithStats[]>([]);
  const [selectedWilayah, setSelectedWilayah] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Async auth check
    getCurrentUser().then(user => {
      if (!isMounted) return;

      if (!user || user.role !== "puskesmas") {
        navigate("/login", { replace: true });
        return;
      }

      loadData();
    });

    return () => { isMounted = false; };
  }, [navigate]);

  const loadData = async (wilayahFilter?: string) => {
    setIsLoading(true);
    try {
      const [statsData, wilayahListData, wilayahStatsData, monthlyDataResult, kadersData] = await Promise.all([
        puskesmasApi.getStats(),
        puskesmasApi.getWilayah(),
        puskesmasApi.getWilayahStats(wilayahFilter && wilayahFilter !== "all" ? wilayahFilter : undefined),
        puskesmasApi.getMonthly(6),
        puskesmasApi.getKaders(),
      ]);

      setStats(statsData);
      setWilayahList(wilayahListData);
      setWilayahStats(wilayahStatsData);
      setMonthlyData(monthlyDataResult);
      setKaders(kadersData);
    } catch (error) {
      console.error("Error loading puskesmas data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWilayahChange = (wilayahId: string) => {
    setSelectedWilayah(wilayahId);
    loadData(wilayahId);
  };

  const handleRefresh = () => {
    loadData(selectedWilayah);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const exportData = await puskesmasApi.getExport();
      exportToCSV(exportData);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Gagal export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const exportData = await puskesmasApi.getExport();
      exportToPDF(exportData);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Gagal export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>Memuat data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <section className={styles.welcome}>
          <div className={styles.welcomeHeader}>
            <div>
              <h1 className={styles.welcomeTitle}>Dashboard Puskesmas</h1>
              <p className={styles.welcomeText}>
                Pantau dan kelola data kesehatan balita di seluruh wilayah kerja puskesmas
              </p>
            </div>
            <div className={styles.welcomeActions}>
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={styles.buttonIcon} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
                <FileDown className={styles.buttonIcon} />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                <FileDown className={styles.buttonIcon} />
                Export PDF
              </Button>
            </div>
          </div>
        </section>

        {/* Statistics Overview */}
        <PuskesmasStatsComponent stats={stats} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className={styles.tabs}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger className={styles.tabTrigger} value="analytics">Analitik & Prevalensi</TabsTrigger>
            <TabsTrigger className={styles.tabTrigger} value="kaders">Manajemen Kader</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className={styles.tabContent}>
            {/* Filter Section */}
            <div className={styles.filterSection}>
              <div className={styles.filterGroup}>
                <Filter className={styles.filterIcon} />
                <span className={styles.filterLabel}>Filter Wilayah:</span>
                <Select value={selectedWilayah} onValueChange={handleWilayahChange}>
                  <SelectTrigger className={styles.filterSelect}>
                    <SelectValue placeholder="Semua Wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Wilayah</SelectItem>
                    {wilayahList.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.nama_wilayah}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Charts and Prevalensi */}
            <PrevalensiChart monthlyData={monthlyData} wilayahData={wilayahStats} />
          </TabsContent>

          <TabsContent value="kaders" className={styles.tabContent}>
            <KaderManagement
              kaders={kaders}
              wilayahList={wilayahList}
              onCreateKader={async (data: any) => {
                const fd = new FormData();
                fd.append("intent", "create-kader");
                fd.append("data", JSON.stringify(data));
                const result = await puskesmasApi.submitAction(fd);
                handleRefresh();
                return result;
              }}
              onUpdateKader={async (id: string, data: any) => {
                const fd = new FormData();
                fd.append("intent", "update-kader");
                fd.append("id", id);
                fd.append("data", JSON.stringify(data));
                const result = await puskesmasApi.submitAction(fd);
                handleRefresh();
                return result;
              }}
              onDeleteKader={async (id: string) => {
                const fd = new FormData();
                fd.append("intent", "delete-kader");
                fd.append("id", id);
                await puskesmasApi.submitAction(fd);
                handleRefresh();
              }}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
