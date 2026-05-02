export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anak: {
        Row: {
          created_at: string | null
          id: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          nama: string
          tanggal_lahir: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          nama: string
          tanggal_lahir: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"]
          nama?: string
          tanggal_lahir?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_anak_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      imunisasi: {
        Row: {
          anak_id: string
          created_at: string | null
          id: string
          nama_imunisasi: string
          tanggal: string
          updated_at: string | null
        }
        Insert: {
          anak_id: string
          created_at?: string | null
          id?: string
          nama_imunisasi: string
          tanggal: string
          updated_at?: string | null
        }
        Update: {
          anak_id?: string
          created_at?: string | null
          id?: string
          nama_imunisasi?: string
          tanggal?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_imunisasi_anak"
            columns: ["anak_id"]
            isOneToOne: false
            referencedRelation: "anak"
            referencedColumns: ["id"]
          },
        ]
      }
      pertumbuhan: {
        Row: {
          anak_id: string
          berat_badan: number
          created_at: string | null
          id: string
          kategori_bbtb: string | null
          kategori_bbu: string | null
          kategori_tbu: string | null
          tanggal_pengukuran: string
          tinggi_badan: number
          umur_bulan: number | null
          updated_at: string | null
          zscore_bbtb: number | null
          zscore_bbu: number | null
          zscore_tbu: number | null
        }
        Insert: {
          anak_id: string
          berat_badan: number
          created_at?: string | null
          id?: string
          kategori_bbtb?: string | null
          kategori_bbu?: string | null
          kategori_tbu?: string | null
          tanggal_pengukuran: string
          tinggi_badan: number
          umur_bulan?: number | null
          updated_at?: string | null
          zscore_bbtb?: number | null
          zscore_bbu?: number | null
          zscore_tbu?: number | null
        }
        Update: {
          anak_id?: string
          berat_badan?: number
          created_at?: string | null
          id?: string
          kategori_bbtb?: string | null
          kategori_bbu?: string | null
          kategori_tbu?: string | null
          tanggal_pengukuran?: string
          tinggi_badan?: number
          umur_bulan?: number | null
          updated_at?: string | null
          zscore_bbtb?: number | null
          zscore_bbu?: number | null
          zscore_tbu?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pertumbuhan_anak"
            columns: ["anak_id"]
            isOneToOne: false
            referencedRelation: "anak"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
          wilayah_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
          wilayah_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          wilayah_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_wilayah"
            columns: ["wilayah_id"]
            isOneToOne: false
            referencedRelation: "wilayah"
            referencedColumns: ["id"]
          },
        ]
      }
      who_reference: {
        Row: {
          created_at: string | null
          id: string
          indikator: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          l: number
          m: number
          s: number
          tinggi_cm: number | null
          umur_bulan: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          indikator: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          l: number
          m: number
          s: number
          tinggi_cm?: number | null
          umur_bulan: number
        }
        Update: {
          created_at?: string | null
          id?: string
          indikator?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"]
          l?: number
          m?: number
          s?: number
          tinggi_cm?: number | null
          umur_bulan?: number
        }
        Relationships: []
      }
      wilayah: {
        Row: {
          created_at: string | null
          id: string
          nama_wilayah: string
          tipe: Database["public"]["Enums"]["wilayah_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          nama_wilayah: string
          tipe: Database["public"]["Enums"]["wilayah_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          nama_wilayah?: string
          tipe?: Database["public"]["Enums"]["wilayah_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      jenis_kelamin: "laki_laki" | "perempuan"
      user_role: "orang_tua" | "kader" | "puskesmas"
      wilayah_type: "desa" | "kelurahan" | "puskesmas"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      jenis_kelamin: ["laki_laki", "perempuan"],
      user_role: ["orang_tua", "kader", "puskesmas"],
      wilayah_type: ["desa", "kelurahan", "puskesmas"],
    },
  },
} as const
