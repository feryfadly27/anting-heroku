import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Baby, Calendar, FileText, TrendingUp, Activity, Heart } from "lucide-react";
import type { Route } from "./+types/parent.dashboard";
import styles from "./parent.dashboard.module.css";
import { DashboardLayout } from "~/components/dashboard-layout";
import { AnakList } from "~/components/anak-list";
import { AnakFormDialog } from "~/components/anak-form-dialog";
import { AnakDetailView } from "~/components/anak-detail-view";
import { PertumbuhanFormDialog } from "~/components/pertumbuhan-form-dialog";
import { ImunisasiFormDialog } from "~/components/imunisasi-form-dialog";
import { ParentDashboardSummary } from "~/components/parent-dashboard-summary";
import { GrowthChart, ZScoreChart } from "~/components/growth-chart";
// Types (use any to avoid importing Prisma-connected modules)
type DashboardStats = any;
type AnakSummary = any;
type GrowthTrend = any;
import { toast } from "~/hooks/use-toast";
import type { Database } from "~/db/types";
import { getCurrentUser } from "~/utils/auth";

// Client-safe API helpers (use fetch instead of direct Prisma imports)
const parentApi = {
  fetchWithError: async (url: string, options?: RequestInit) => {
    const r = await fetch(url, options);
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
  getDashboardData: () => parentApi.fetchWithError("/api/parent/dashboard"),
  getStats: () => parentApi.fetchWithError("/api/parent/dashboard?action=stats"),
  getSummaries: () => parentApi.fetchWithError("/api/parent/dashboard?action=summaries"),
  getAnak: () => parentApi.fetchWithError("/api/parent/dashboard?action=anak"),
  getGrowthTrend: (anakId: string, count = 10) => parentApi.fetchWithError(`/api/parent/dashboard?action=growth-trend&anakId=${anakId}&count=${count}`),
  getPertumbuhan: (anakId: string) => parentApi.fetchWithError(`/api/parent/dashboard?action=pertumbuhan&anakId=${anakId}`),
  getImunisasi: (anakId: string) => parentApi.fetchWithError(`/api/parent/dashboard?action=imunisasi&anakId=${anakId}`),
  submitAction: (formData: FormData) => parentApi.fetchWithError("/api/parent/dashboard", { method: "POST", body: formData }),
};

type AnakRow = Database["public"]["Tables"]["anak"]["Row"];
type PertumbuhanRow = Database["public"]["Tables"]["pertumbuhan"]["Row"];
type ImunisasiRow = Database["public"]["Tables"]["imunisasi"]["Row"];

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dashboard Orang Tua - Anting" },
    {
      name: "description",
      content: "Dashboard untuk orang tua di Anting",
    },
  ];
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const [anakList, setAnakList] = useState<AnakRow[]>([]);
  const [selectedAnak, setSelectedAnak] = useState<AnakRow | null>(null);
  const [pertumbuhanList, setPertumbuhanList] = useState<PertumbuhanRow[]>([]);
  const [imunisasiList, setImunisasiList] = useState<ImunisasiRow[]>([]);

  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [anakSummaries, setAnakSummaries] = useState<AnakSummary[]>([]);
  const [growthTrends, setGrowthTrends] = useState<Map<string, GrowthTrend[]>>(new Map());
  const [viewMode, setViewMode] = useState<"overview" | "detail">("overview");

  const [isAnakDialogOpen, setIsAnakDialogOpen] = useState(false);
  const [isPertumbuhanDialogOpen, setIsPertumbuhanDialogOpen] = useState(false);
  const [isImunisasiDialogOpen, setIsImunisasiDialogOpen] = useState(false);

  const [editingAnak, setEditingAnak] = useState<AnakRow | null>(null);
  const [editingPertumbuhan, setEditingPertumbuhan] = useState<PertumbuhanRow | null>(null);
  const [editingImunisasi, setEditingImunisasi] = useState<ImunisasiRow | null>(null);

  const [loading, setLoading] = useState(true);

  // Auth check and initial data load
  useEffect(() => {
    let isMounted = true;

    // Async auth check
    getCurrentUser().then(user => {
      if (!isMounted) return;

      if (!user || user.role !== "orang_tua") {
        navigate("/login", { replace: true });
        return;
      }

      setUserId(user.id);
    });

    return () => { isMounted = false; };
  }, [navigate]);

  // Load data when userId is set
  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  // Data loading function

  // Load pertumbuhan and imunisasi data when anak is selected
  useEffect(() => {
    if (selectedAnak) {
      loadPertumbuhanData(selectedAnak.id);
      loadImunisasiData(selectedAnak.id);
    }
  }, [selectedAnak]);

  const loadDashboardData = async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [stats, summaries, anakData] = await Promise.all([
        parentApi.getStats(),
        parentApi.getSummaries(),
        parentApi.getAnak(),
      ]);

      setDashboardStats(stats);
      setAnakSummaries(summaries);
      setAnakList(anakData);

      // Load growth trends for anak with data
      const trendsMap = new Map<string, GrowthTrend[]>();
      await Promise.all(
        summaries
          .filter((s: any) => s.pertumbuhanCount > 0)
          .map(async (s: any) => {
            const trend = await parentApi.getGrowthTrend(s.anak.id, 10);
            trendsMap.set(s.anak.id, trend);
          })
      );
      setGrowthTrends(trendsMap);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPertumbuhanData = async (anakId: string) => {
    try {
      const data = await parentApi.getPertumbuhan(anakId);
      setPertumbuhanList(data);
    } catch (error) {
      console.error("Error loading pertumbuhan data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pertumbuhan",
        variant: "destructive",
      });
    }
  };

  const loadImunisasiData = async (anakId: string) => {
    try {
      const data = await parentApi.getImunisasi(anakId);
      setImunisasiList(data);
    } catch (error) {
      console.error("Error loading imunisasi data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data imunisasi",
        variant: "destructive",
      });
    }
  };

  // Anak CRUD handlers
  const handleAddAnak = () => {
    setEditingAnak(null);
    setIsAnakDialogOpen(true);
  };

  const handleEditAnak = (anak: AnakRow) => {
    setEditingAnak(anak);
    setIsAnakDialogOpen(true);
  };

  const handleSubmitAnak = async (data: any) => {
    try {
      const fd = new FormData();
      if (editingAnak) {
        fd.append("intent", "update-anak");
        fd.append("id", editingAnak.id);
      } else {
        fd.append("intent", "create-anak");
      }
      fd.append("nama", data.nama);
      fd.append("tanggal_lahir", data.tanggal_lahir);
      fd.append("jenis_kelamin", data.jenis_kelamin);
      await parentApi.submitAction(fd);
      toast({
        title: "Berhasil",
        description: editingAnak ? "Data anak berhasil diperbarui" : "Data anak berhasil ditambahkan",
      });
      loadDashboardData();
      setIsAnakDialogOpen(false);
      setEditingAnak(null);
    } catch (error) {
      console.error("Error saving anak:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data anak",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAnak = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data anak ini?")) return;

    try {
      const fd = new FormData();
      fd.append("intent", "delete-anak");
      fd.append("id", id);
      await parentApi.submitAction(fd);
      toast({
        title: "Berhasil",
        description: "Data anak berhasil dihapus",
      });
      loadDashboardData();
      if (selectedAnak?.id === id) {
        setSelectedAnak(null);
        setViewMode("overview");
      }
    } catch (error) {
      console.error("Error deleting anak:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data anak",
        variant: "destructive",
      });
    }
  };

  // Pertumbuhan CRUD handlers
  const handleAddPertumbuhan = () => {
    setEditingPertumbuhan(null);
    setIsPertumbuhanDialogOpen(true);
  };

  const handleEditPertumbuhan = (pertumbuhan: PertumbuhanRow) => {
    setEditingPertumbuhan(pertumbuhan);
    setIsPertumbuhanDialogOpen(true);
  };

  const handleSubmitPertumbuhan = async (data: any) => {
    try {
      const fd = new FormData();
      if (editingPertumbuhan) {
        fd.append("intent", "update-pertumbuhan");
        fd.append("id", editingPertumbuhan.id);
      } else {
        fd.append("intent", "create-pertumbuhan");
      }
      fd.append("data", JSON.stringify(data));
      await parentApi.submitAction(fd);
      toast({
        title: "Berhasil",
        description: editingPertumbuhan ? "Data pertumbuhan berhasil diperbarui" : "Data pertumbuhan berhasil ditambahkan",
      });
      if (selectedAnak) {
        loadPertumbuhanData(selectedAnak.id);
      }
      // Reload dashboard to update stats and charts
      loadDashboardData();
      setIsPertumbuhanDialogOpen(false);
      setEditingPertumbuhan(null);
    } catch (error) {
      console.error("Error saving pertumbuhan:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data pertumbuhan",
        variant: "destructive",
      });
    }
  };

  const handleDeletePertumbuhan = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data pertumbuhan ini?")) return;

    try {
      const fd = new FormData();
      fd.append("intent", "delete-pertumbuhan");
      fd.append("id", id);
      await parentApi.submitAction(fd);
      toast({
        title: "Berhasil",
        description: "Data pertumbuhan berhasil dihapus",
      });
      if (selectedAnak) {
        loadPertumbuhanData(selectedAnak.id);
      }
      loadDashboardData();
    } catch (error) {
      console.error("Error deleting pertumbuhan:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data pertumbuhan",
        variant: "destructive",
      });
    }
  };

  // Imunisasi CRUD handlers
  const handleAddImunisasi = () => {
    setEditingImunisasi(null);
    setIsImunisasiDialogOpen(true);
  };

  const handleEditImunisasi = (imunisasi: ImunisasiRow) => {
    setEditingImunisasi(imunisasi);
    setIsImunisasiDialogOpen(true);
  };

  const handleSubmitImunisasi = async (data: any) => {
    try {
      const fd = new FormData();
      if (editingImunisasi) {
        fd.append("intent", "update-imunisasi");
        fd.append("id", editingImunisasi.id);
      } else {
        fd.append("intent", "create-imunisasi");
      }
      fd.append("data", JSON.stringify(data));
      await parentApi.submitAction(fd);
      toast({
        title: "Berhasil",
        description: editingImunisasi ? "Data imunisasi berhasil diperbarui" : "Data imunisasi berhasil ditambahkan",
      });
      if (selectedAnak) {
        loadImunisasiData(selectedAnak.id);
      }
      setIsImunisasiDialogOpen(false);
      setEditingImunisasi(null);
    } catch (error) {
      console.error("Error saving imunisasi:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data imunisasi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImunisasi = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data imunisasi ini?")) return;

    try {
      const fd = new FormData();
      fd.append("intent", "delete-imunisasi");
      fd.append("id", id);
      await parentApi.submitAction(fd);
      toast({
        title: "Berhasil",
        description: "Data imunisasi berhasil dihapus",
      });
      if (selectedAnak) {
        loadImunisasiData(selectedAnak.id);
      }
    } catch (error) {
      console.error("Error deleting imunisasi:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data imunisasi",
        variant: "destructive",
      });
    }
  };

  const handleSelectAnakFromSummary = async (anakId: string) => {
    const anak = anakList.find((a) => a.id === anakId);
    if (anak) {
      setSelectedAnak(anak);
      setViewMode("detail");

      // Load detail data
      await Promise.all([loadPertumbuhanData(anakId), loadImunisasiData(anakId)]);
    }
  };

  const handleBackToOverview = () => {
    setSelectedAnak(null);
    setViewMode("overview");
  };

  if (loading || !userId) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>Memuat data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        {viewMode === "overview" ? (
          <>
            <section className={styles.welcome}>
              <h1 className={styles.welcomeTitle}>Dashboard Orang Tua</h1>
              <p className={styles.welcomeText}>
                Pantau perkembangan kesehatan bayi Anda dengan mudah. Lihat ringkasan data, Z-score terbaru, dan grafik
                pertumbuhan.
              </p>
            </section>

            {dashboardStats && (
              <ParentDashboardSummary
                stats={dashboardStats}
                anakSummaries={anakSummaries}
                onSelectAnak={handleSelectAnakFromSummary}
              />
            )}

            {/* Growth Charts Section */}
            {anakSummaries.length > 0 && anakSummaries.some((s) => s.pertumbuhanCount > 0) && (
              <section className={styles.chartsSection}>
                <h2 className={styles.sectionTitle}>Grafik Pertumbuhan</h2>
                <div className={styles.chartsGrid}>
                  {anakSummaries
                    .filter((s) => s.pertumbuhanCount > 0)
                    .map((summary) => {
                      const trend = growthTrends.get(summary.anak.id) || [];
                      return (
                        <div key={summary.anak.id} className={styles.chartContainer}>
                          <h3 className={styles.chartTitle}>{summary.anak.nama}</h3>
                          <GrowthChart data={trend} title="Berat & Tinggi Badan" />
                          <ZScoreChart data={trend} title="Z-Score WHO" />
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            {/* Manage Children Section */}
            <section className={styles.manageSection}>
              <h2 className={styles.sectionTitle}>Kelola Data Anak</h2>
              <AnakList
                anakList={anakList}
                onAdd={handleAddAnak}
                onEdit={handleEditAnak}
                onDelete={handleDeleteAnak}
                onSelect={(anak) => {
                  setSelectedAnak(anak);
                  setViewMode("detail");
                  loadPertumbuhanData(anak.id);
                  loadImunisasiData(anak.id);
                }}
              />
            </section>
          </>
        ) : selectedAnak ? (
          <AnakDetailView
            anak={selectedAnak}
            pertumbuhanList={pertumbuhanList}
            imunisasiList={imunisasiList}
            onBack={handleBackToOverview}
            onAddPertumbuhan={handleAddPertumbuhan}
            onEditPertumbuhan={handleEditPertumbuhan}
            onDeletePertumbuhan={handleDeletePertumbuhan}
            onAddImunisasi={handleAddImunisasi}
            onEditImunisasi={handleEditImunisasi}
            onDeleteImunisasi={handleDeleteImunisasi}
          />
        ) : null}

        {/* Dialogs */}
        <AnakFormDialog
          open={isAnakDialogOpen}
          onOpenChange={setIsAnakDialogOpen}
          onSubmit={handleSubmitAnak}
          anak={editingAnak}
          userId={userId}
        />

        {selectedAnak && (
          <>
            <PertumbuhanFormDialog
              open={isPertumbuhanDialogOpen}
              onOpenChange={setIsPertumbuhanDialogOpen}
              onSubmit={handleSubmitPertumbuhan}
              pertumbuhan={editingPertumbuhan}
              anakId={selectedAnak.id}
            />

            <ImunisasiFormDialog
              open={isImunisasiDialogOpen}
              onOpenChange={setIsImunisasiDialogOpen}
              onSubmit={handleSubmitImunisasi}
              imunisasi={editingImunisasi}
              anakId={selectedAnak.id}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
