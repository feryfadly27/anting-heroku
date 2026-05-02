import { useState } from "react";
import {
  Users,
  Calendar,
  Activity,
  AlertCircle,
  Search,
} from "lucide-react";
// Types (replicate or use any to avoid importing Prisma-connected modules)
type AnakWithParentInfo = any;
import { PertumbuhanFormDialog } from "./pertumbuhan-form-dialog";
import { ImunisasiFormDialog } from "./imunisasi-form-dialog";
import type { Database } from "~/db/types";

// Client-safe API helpers
const cadreApi = {
  submitAction: async (formData: FormData) => {
    const r = await fetch("/api/cadre/dashboard", { method: "POST", body: formData });
    if (!r.ok) {
      const error = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed with status ${r.status}`);
    }
    return r.json();
  },
};

type PertumbuhanInsert = Database["public"]["Tables"]["pertumbuhan"]["Insert"];
type ImunisasiInsert = Database["public"]["Tables"]["imunisasi"]["Insert"];
import { Badge } from "./ui/badge/badge";
import { Input } from "./ui/input/input";
import { Button } from "./ui/button/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table/table";
import styles from "./cadre-anak-list.module.css";

interface CadreAnakListProps {
  anakList: AnakWithParentInfo[];
  onDataUpdated: () => void;
}

type FilterType = "all" | "normal" | "perlu-perhatian";

export function CadreAnakList({ anakList, onDataUpdated }: CadreAnakListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedAnakId, setSelectedAnakId] = useState<string | null>(null);
  const [showPertumbuhanDialog, setShowPertumbuhanDialog] = useState(false);
  const [showImunisasiDialog, setShowImunisasiDialog] = useState(false);

  // Filter and search
  const filteredAnak = anakList.filter((anak) => {
    // Search filter
    const matchesSearch =
      anak.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anak.parent_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    // Status filter
    const p = anak.latest_pertumbuhan;
    if (!p) return filter === "all";

    const needsAttention =
      (p.zscore_tbu !== null && p.zscore_tbu < -2) ||
      (p.zscore_bbu !== null && p.zscore_bbu < -2) ||
      (p.zscore_bbtb !== null && p.zscore_bbtb < -2);

    if (filter === "perlu-perhatian") return needsAttention;
    if (filter === "normal") return !needsAttention;

    return true;
  });

  const calculateAgeMonths = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();

    let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();

    // Kurangi 1 bulan jika hari ini belum melewati tanggal lahir di bulan ini
    if (now.getDate() < birth.getDate()) {
      months--;
    }

    if (months < 0) return 0;
    return months;
  };

  const getStatusBadge = (anak: AnakWithParentInfo) => {
    const p = anak.latest_pertumbuhan;
    if (!p) {
      return (
        <Badge variant="outline" className={styles.badgeNoData}>
          Belum Ada Data
        </Badge>
      );
    }

    const needsAttention =
      (p.zscore_tbu !== null && p.zscore_tbu < -2) ||
      (p.zscore_bbu !== null && p.zscore_bbu < -2) ||
      (p.zscore_bbtb !== null && p.zscore_bbtb < -2);

    if (needsAttention) {
      return (
        <Badge variant="destructive" className={styles.badgeAttention}>
          <AlertCircle size={14} />
          Perlu Perhatian
        </Badge>
      );
    }

    return (
      <Badge variant="default" className={styles.badgeNormal}>
        Normal
      </Badge>
    );
  };

  const handleInputPertumbuhan = (anakId: string) => {
    setSelectedAnakId(anakId);
    setShowPertumbuhanDialog(true);
  };

  const handleInputImunisasi = (anakId: string) => {
    setSelectedAnakId(anakId);
    setShowImunisasiDialog(true);
  };

  const handlePertumbuhanSubmit = async (data: PertumbuhanInsert) => {
    try {
      const fd = new FormData();
      fd.append("intent", "create-pertumbuhan");
      fd.append("data", JSON.stringify(data));
      await cadreApi.submitAction(fd);

      setShowPertumbuhanDialog(false);
      setSelectedAnakId(null);
      onDataUpdated();
    } catch (error) {
      console.error("Error saving pertumbuhan:", error);
    }
  };

  const handleImunisasiSubmit = async (data: ImunisasiInsert) => {
    try {
      const fd = new FormData();
      fd.append("intent", "create-imunisasi");
      fd.append("data", JSON.stringify(data));
      await cadreApi.submitAction(fd);

      setShowImunisasiDialog(false);
      setSelectedAnakId(null);
      onDataUpdated();
    } catch (error) {
      console.error("Error saving imunisasi:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Users className={styles.titleIcon} />
          <h2 className={styles.title}>Daftar Anak di Wilayah Binaan</h2>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <Input
              type="text"
              placeholder="Cari nama anak atau orang tua..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterButtons}>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Semua ({anakList.length})
            </Button>
            <Button
              variant={filter === "normal" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("normal")}
            >
              Normal
            </Button>
            <Button
              variant={filter === "perlu-perhatian" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("perlu-perhatian")}
            >
              <AlertCircle size={14} />
              Perlu Perhatian
            </Button>
          </div>
        </div>
      </div>

      {filteredAnak.length === 0 ? (
        <div className={styles.empty}>
          <Users size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            {searchQuery ? "Tidak ada anak yang cocok dengan pencarian" : "Belum ada data anak"}
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '50px' }}>No</TableHead>
                <TableHead>Nama Anak</TableHead>
                <TableHead>Tanggal Lahir</TableHead>
                <TableHead>Umur (bulan)</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Berat Badan (kg)</TableHead>
                <TableHead>Tinggi Badan (cm)</TableHead>
                <TableHead>Status Gizi (Normal/Stunting)</TableHead>
                <TableHead>Tanggal Pemeriksaan</TableHead>
                <TableHead>Catatan / Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnak.map((anak, index) => (
                <TableRow key={anak.id}>
                  {/* No */}
                  <TableCell>{index + 1}</TableCell>

                  {/* Nama Anak */}
                  <TableCell>
                    <div style={{ fontWeight: 600, color: 'var(--color-neutral-12)' }}>{anak.nama}</div>
                  </TableCell>

                  {/* Tanggal Lahir */}
                  <TableCell>
                    {new Date(anak.tanggal_lahir).toLocaleDateString("id-ID")}
                  </TableCell>

                  {/* Umur (bulan) */}
                  <TableCell>{calculateAgeMonths(anak.tanggal_lahir)}</TableCell>

                  {/* Jenis Kelamin */}
                  <TableCell>{anak.jenis_kelamin === "laki_laki" ? "L" : "P"}</TableCell>

                  {/* Berat Badan */}
                  <TableCell>
                    {anak.latest_pertumbuhan ? anak.latest_pertumbuhan.berat_badan : "-"}
                  </TableCell>

                  {/* Tinggi Badan */}
                  <TableCell>
                    {anak.latest_pertumbuhan ? anak.latest_pertumbuhan.tinggi_badan : "-"}
                  </TableCell>

                  {/* Status Gizi */}
                  <TableCell>
                    {anak.latest_pertumbuhan ? (
                      anak.latest_pertumbuhan.zscore_tbu !== null ? (
                        <Badge
                          variant={
                            anak.latest_pertumbuhan.zscore_tbu < -2
                              ? "destructive"
                              : "default" /* Stunting is usually based on TB/U < -2 */
                          }
                          className={styles.zscoreBadge}
                        >
                          {anak.latest_pertumbuhan.zscore_tbu < -2 ? "Stunting" : "Normal"}
                        </Badge>
                      ) : (
                        <span style={{ color: "var(--color-neutral-8)" }}>Ada Data</span>
                      )
                    ) : (
                      <span style={{ color: "var(--color-neutral-8)" }}>-</span>
                    )}
                  </TableCell>

                  {/* Tanggal Pemeriksaan */}
                  <TableCell>
                    {anak.latest_pertumbuhan
                      ? new Date(anak.latest_pertumbuhan.tanggal_pengukuran).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>

                  {/* Catatan / Aksi */}
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleInputPertumbuhan(anak.id)}
                        className={styles.actionButton}
                        style={{ fontSize: '0.75rem', padding: '0 8px', height: '24px' }}
                      >
                        <Activity size={12} style={{ marginRight: '4px' }} /> BB/TB
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputImunisasi(anak.id)}
                        className={styles.actionButton}
                        style={{ fontSize: '0.75rem', padding: '0 8px', height: '24px' }}
                      >
                        <Calendar size={12} style={{ marginRight: '4px' }} /> Imunisasi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      {selectedAnakId && (
        <>
          <PertumbuhanFormDialog
            open={showPertumbuhanDialog}
            onOpenChange={setShowPertumbuhanDialog}
            anakId={selectedAnakId}
            onSubmit={handlePertumbuhanSubmit}
          />
          <ImunisasiFormDialog
            open={showImunisasiDialog}
            onOpenChange={setShowImunisasiDialog}
            anakId={selectedAnakId}
            onSubmit={handleImunisasiSubmit}
          />
        </>
      )}
    </div>
  );
}
