import { Baby, Edit, Trash2, Plus } from "lucide-react";
import { Card } from "./ui/card/card";
import { Button } from "./ui/button/button";
import type { Database } from "~/db/types";
import styles from "./anak-list.module.css";

type AnakRow = Database["public"]["Tables"]["anak"]["Row"];

interface AnakListProps {
  anakList: AnakRow[];
  onEdit: (anak: AnakRow) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onSelect: (anak: AnakRow) => void;
}

export function AnakList({ anakList, onEdit, onDelete, onAdd, onSelect }: AnakListProps) {
  const calculateAge = (tanggalLahir: string) => {
    const today = new Date();
    const birthDate = new Date(tanggalLahir);
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());

    if (months < 12) {
      return `${months} bulan`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years} tahun ${remainingMonths} bulan` : `${years} tahun`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Daftar Anak</h2>
        <Button onClick={onAdd} variant="default">
          <Plus size={16} />
          Tambah Anak
        </Button>
      </div>

      {anakList.length === 0 ? (
        <Card className={styles.emptyState}>
          <Baby size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>Belum ada data anak</p>
          <p className={styles.emptySubtext}>Klik tombol "Tambah Anak" untuk menambahkan data anak</p>
        </Card>
      ) : (
        <div className={styles.grid}>
          {anakList.map((anak) => (
            <Card key={anak.id} className={styles.card} onClick={() => onSelect(anak)}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  <Baby size={24} />
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(anak);
                    }}
                    className={styles.actionButton}
                    aria-label="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(anak.id);
                    }}
                    className={styles.actionButtonDanger}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.name}>{anak.nama}</h3>
                <div className={styles.info}>
                  <span className={styles.infoLabel}>Jenis Kelamin:</span>
                  <span className={styles.infoValue}>
                    {anak.jenis_kelamin === "laki_laki" ? "Laki-laki" : "Perempuan"}
                  </span>
                </div>
                <div className={styles.info}>
                  <span className={styles.infoLabel}>Tanggal Lahir:</span>
                  <span className={styles.infoValue}>
                    {new Date(anak.tanggal_lahir).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className={styles.info}>
                  <span className={styles.infoLabel}>Umur:</span>
                  <span className={styles.infoValue}>{calculateAge(anak.tanggal_lahir)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
