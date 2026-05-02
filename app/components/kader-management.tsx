import { useState } from "react";
import { Plus, Edit, Trash2, MapPin, Users as UsersIcon } from "lucide-react";
import styles from "./kader-management.module.css";
import { Button } from "./ui/button/button";
import { Input } from "./ui/input/input";
import { Label } from "./ui/label/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select/select";
import type { KaderWithStats, Wilayah } from "~/db/services/puskesmas.service";

interface KaderManagementProps {
  kaders: KaderWithStats[];
  wilayahList: Wilayah[];
  onCreateKader: (name: string, email: string, password: string, wilayahId: string) => Promise<void>;
  onUpdateKader: (kaderId: string, updates: { name?: string; email?: string; wilayah_id?: string }) => Promise<void>;
  onDeleteKader: (kaderId: string) => Promise<void>;
  onRefresh: () => void;
}

export function KaderManagement({
  kaders,
  wilayahList,
  onCreateKader,
  onUpdateKader,
  onDeleteKader,
  onRefresh,
}: KaderManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedKader, setSelectedKader] = useState<KaderWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create form
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createWilayah, setCreateWilayah] = useState("");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWilayah, setEditWilayah] = useState("");

  const filteredKaders = kaders.filter(
    (k) =>
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.wilayah_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!createName || !createEmail || !createPassword || !createWilayah) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      await onCreateKader(createName, createEmail, createPassword, createWilayah);
      setIsCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateWilayah("");
      onRefresh();
    } catch (error) {
      alert("Gagal membuat kader: " + (error as Error).message);
    }
  };

  const handleEdit = async () => {
    if (!selectedKader) return;

    try {
      await onUpdateKader(selectedKader.id, {
        name: editName,
        email: editEmail,
        wilayah_id: editWilayah,
      });
      setIsEditOpen(false);
      setSelectedKader(null);
      onRefresh();
    } catch (error) {
      alert("Gagal mengupdate kader: " + (error as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!selectedKader) return;

    try {
      await onDeleteKader(selectedKader.id);
      setIsDeleteOpen(false);
      setSelectedKader(null);
      onRefresh();
    } catch (error) {
      alert("Gagal menghapus kader: " + (error as Error).message);
    }
  };

  const openEdit = (kader: KaderWithStats) => {
    setSelectedKader(kader);
    setEditName(kader.name);
    setEditEmail(kader.email);
    setEditWilayah(kader.wilayah_id || "");
    setIsEditOpen(true);
  };

  const openDelete = (kader: KaderWithStats) => {
    setSelectedKader(kader);
    setIsDeleteOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manajemen Kader Posyandu</h2>
        <div className={styles.actions}>
          <Input
            placeholder="Cari kader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className={styles.buttonIcon} />
            Tambah Kader
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredKaders.map((kader) => (
          <div key={kader.id} className={styles.kaderCard}>
            <div className={styles.kaderHeader}>
              <div className={styles.kaderInfo}>
                <h3 className={styles.kaderName}>{kader.name}</h3>
                <p className={styles.kaderEmail}>{kader.email}</p>
              </div>
              <div className={styles.kaderActions}>
                <button className={styles.iconButton} onClick={() => openEdit(kader)} title="Edit">
                  <Edit className={styles.icon} />
                </button>
                <button className={styles.iconButtonDanger} onClick={() => openDelete(kader)} title="Hapus">
                  <Trash2 className={styles.icon} />
                </button>
              </div>
            </div>

            <div className={styles.kaderDetails}>
              <div className={styles.detailRow}>
                <MapPin className={styles.detailIcon} />
                <span className={styles.detailText}>{kader.wilayah_name || "Belum ada wilayah"}</span>
              </div>
              <div className={styles.detailRow}>
                <UsersIcon className={styles.detailIcon} />
                <span className={styles.detailText}>{kader.totalBalita} balita</span>
              </div>
            </div>

            <div className={styles.kaderStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Pemeriksaan</span>
                <span className={styles.statValue}>{kader.totalPemeriksaan}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredKaders.length === 0 && (
        <div className={styles.empty}>
          <UsersIcon className={styles.emptyIcon} />
          <p className={styles.emptyText}>Tidak ada kader ditemukan</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kader Baru</DialogTitle>
            <DialogDescription>Tambahkan kader posyandu baru ke sistem</DialogDescription>
          </DialogHeader>
          <div className={styles.formGroup}>
            <Label htmlFor="create-name">Nama Lengkap</Label>
            <Input id="create-name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="create-wilayah">Wilayah</Label>
            <Select value={createWilayah} onValueChange={setCreateWilayah}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih wilayah" />
              </SelectTrigger>
              <SelectContent>
                {wilayahList.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.nama_wilayah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kader</DialogTitle>
            <DialogDescription>Update informasi kader</DialogDescription>
          </DialogHeader>
          <div className={styles.formGroup}>
            <Label htmlFor="edit-name">Nama Lengkap</Label>
            <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="edit-wilayah">Wilayah</Label>
            <Select value={editWilayah} onValueChange={setEditWilayah}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih wilayah" />
              </SelectTrigger>
              <SelectContent>
                {wilayahList.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.nama_wilayah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kader</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kader <strong>{selectedKader?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
