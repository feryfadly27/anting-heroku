import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog/dialog";
import { Button } from "./ui/button/button";
import { Input } from "./ui/input/input";
import { Label } from "./ui/label/label";
import type { Database } from "~/db/types";
import styles from "./anak-form-dialog.module.css";

type AnakRow = Database["public"]["Tables"]["anak"]["Row"];
type AnakInsert = Database["public"]["Tables"]["anak"]["Insert"];

interface AnakFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AnakInsert) => void;
  anak?: AnakRow | null;
  userId: string;
}

interface FormData {
  nama: string;
  tanggal_lahir: string;
  jenis_kelamin: "laki_laki" | "perempuan";
}

export function AnakFormDialog({ open, onOpenChange, onSubmit, anak, userId }: AnakFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      nama: anak?.nama || "",
      tanggal_lahir: anak?.tanggal_lahir || "",
      jenis_kelamin: anak?.jenis_kelamin || "laki_laki",
    },
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      user_id: userId,
      ...(anak && { id: anak.id }),
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle>{anak ? "Edit Data Anak" : "Tambah Data Anak"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
          <div className={styles.field}>
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              {...register("nama", { required: "Nama wajib diisi" })}
              placeholder="Masukkan nama anak"
            />
            {errors.nama && <span className={styles.error}>{errors.nama.message}</span>}
          </div>

          <div className={styles.field}>
            <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
            <Input id="tanggal_lahir" type="date" {...register("tanggal_lahir", { required: "Tanggal lahir wajib diisi" })} />
            {errors.tanggal_lahir && <span className={styles.error}>{errors.tanggal_lahir.message}</span>}
          </div>

          <div className={styles.field}>
            <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
            <select
              id="jenis_kelamin"
              className={styles.select}
              {...register("jenis_kelamin", { required: "Jenis kelamin wajib dipilih" })}
            >
              <option value="laki_laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
            {errors.jenis_kelamin && <span className={styles.error}>{errors.jenis_kelamin.message}</span>}
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">{anak ? "Simpan Perubahan" : "Tambah Anak"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
