export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DocumentJenis =
  | "sertifikat_tanah"
  | "ktp_pemilik"
  | "imb_pbg"
  | "surat_kuasa"

export type Database = {
  public: {
    Tables: {
      designs: {
        Row: {
          created_at: string
          created_by: string | null
          deskripsi: string | null
          estimasi_biaya: number
          estimasi_durasi_hari: number
          gaya_arsitektur: string
          highlights: string[]
          id: string
          is_active: boolean
          jumlah_kamar_mandi: number | null
          jumlah_kamar_tidur: number | null
          jumlah_lantai: number | null
          lokasi: string | null
          luas_bangunan: number | null
          luas_tanah: number | null
          nama: string
          slug: string | null
          spesifikasi: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          estimasi_biaya: number
          estimasi_durasi_hari: number
          gaya_arsitektur: string
          highlights?: string[]
          id?: string
          is_active?: boolean
          jumlah_kamar_mandi?: number | null
          jumlah_kamar_tidur?: number | null
          jumlah_lantai?: number | null
          lokasi?: string | null
          luas_bangunan?: number | null
          luas_tanah?: number | null
          nama: string
          slug?: string | null
          spesifikasi?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          estimasi_biaya?: number
          estimasi_durasi_hari?: number
          gaya_arsitektur?: string
          highlights?: string[]
          id?: string
          is_active?: boolean
          jumlah_kamar_mandi?: number | null
          jumlah_kamar_tidur?: number | null
          jumlah_lantai?: number | null
          lokasi?: string | null
          luas_bangunan?: number | null
          luas_tanah?: number | null
          nama?: string
          slug?: string | null
          spesifikasi?: Json
        }
      }
      design_images: {
        Row: {
          design_id: string
          id: string
          urutan: number
          url: string
        }
        Insert: {
          design_id: string
          id?: string
          urutan?: number
          url: string
        }
        Update: {
          design_id?: string
          id?: string
          urutan?: number
          url?: string
        }
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
      }
      projects: {
        Row: {
          alamat_proyek: string | null
          budget_proyek: number | null
          created_at: string
          customer_id: string
          design_id: string
          id: string
          nilai_proyek: number | null
          pengawas_id: string | null
          requirement_id: string | null
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          alamat_proyek?: string | null
          budget_proyek?: number | null
          created_at?: string
          customer_id: string
          design_id: string
          id?: string
          nilai_proyek?: number | null
          pengawas_id?: string | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          alamat_proyek?: string | null
          budget_proyek?: number | null
          created_at?: string
          customer_id?: string
          design_id?: string
          id?: string
          nilai_proyek?: number | null
          pengawas_id?: string | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
      }
      project_documents: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          jenis_dokumen: DocumentJenis
          mime_type: string | null
          nama_dokumen: string
          project_id: string
          ukuran_bytes: number | null
          uploaded_by: string
          url: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          jenis_dokumen: DocumentJenis
          mime_type?: string | null
          nama_dokumen: string
          project_id: string
          ukuran_bytes?: number | null
          uploaded_by: string
          url: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          jenis_dokumen?: DocumentJenis
          mime_type?: string | null
          nama_dokumen?: string
          project_id?: string
          ukuran_bytes?: number | null
          uploaded_by?: string
          url?: string
        }
      }
    }
    Functions: {
      submit_project: { Args: { pid: string }; Returns: undefined }
    }
    Enums: {
      contract_status: "draft" | "menunggu_ttd" | "aktif" | "selesai"
      kendala_status: "reported" | "reviewed" | "resolved"
      payment_status: "belum" | "lunas"
      project_status:
        | "draft"
        | "verifikasi_dokumen"
        | "revisi_dokumen"
        | "alokasi_mandor_pengawas"
        | "finalisasi_kontrak"
        | "pembayaran_dp"
        | "berjalan"
        | "selesai"
        | "batal"
      report_status: "pending" | "verified"
      user_role: "customer" | "admin" | "pengawas" | "mandor"
      verifikasi_status: "pending" | "approved" | "rejected"
    }
  }
}

export type UserRole = Database["public"]["Enums"]["user_role"]
export type ProjectStatus = Database["public"]["Enums"]["project_status"]
