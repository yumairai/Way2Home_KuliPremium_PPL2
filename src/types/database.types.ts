export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DocumentJenis =
  "sertifikat_tanah" | "ktp_pemilik" | "imb_pbg" | "surat_kuasa";

export type Database = {
  public: {
    Tables: {
      designs: {
        Row: {
          created_at: string;
          created_by: string | null;
          deskripsi: string | null;
          durasi_bulan: number | null;
          estimasi_biaya: number;
          estimasi_durasi_hari: number;
          gaya_arsitektur: string;
          highlights: string[];
          id: string;
          is_active: boolean;
          jumlah_kamar_mandi: number | null;
          jumlah_kamar_tidur: number | null;
          jumlah_lantai: number | null;
          lokasi: string | null;
          luas_bangunan: number | null;
          luas_tanah: number | null;
          nama: string;
          slug: string | null;
          spesifikasi: Json;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deskripsi?: string | null;
          durasi_bulan?: number | null;
          estimasi_biaya: number;
          estimasi_durasi_hari: number;
          gaya_arsitektur: string;
          highlights?: string[];
          id?: string;
          is_active?: boolean;
          jumlah_kamar_mandi?: number | null;
          jumlah_kamar_tidur?: number | null;
          jumlah_lantai?: number | null;
          lokasi?: string | null;
          luas_bangunan?: number | null;
          luas_tanah?: number | null;
          nama: string;
          slug?: string | null;
          spesifikasi?: Json;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deskripsi?: string | null;
          durasi_bulan?: number | null;
          estimasi_biaya?: number;
          estimasi_durasi_hari?: number;
          gaya_arsitektur?: string;
          highlights?: string[];
          id?: string;
          is_active?: boolean;
          jumlah_kamar_mandi?: number | null;
          jumlah_kamar_tidur?: number | null;
          jumlah_lantai?: number | null;
          lokasi?: string | null;
          luas_bangunan?: number | null;
          luas_tanah?: number | null;
          nama?: string;
          slug?: string | null;
          spesifikasi?: Json;
        };
        Relationships: [];
      };
      design_images: {
        Row: {
          design_id: string;
          id: string;
          urutan: number;
          url: string;
        };
        Insert: {
          design_id: string;
          id?: string;
          urutan?: number;
          url: string;
        };
        Update: {
          design_id?: string;
          id?: string;
          urutan?: number;
          url?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      projects: {
        Row: {
          alamat_proyek: string | null;
          budget_proyek: number | null;
          created_at: string;
          customer_id: string;
          design_id: string;
          id: string;
          nilai_proyek: number | null;
          pengawas_id: string | null;
          requirement_id: string | null;
          status: Database["public"]["Enums"]["project_status"];
        };
        Insert: {
          alamat_proyek?: string | null;
          budget_proyek?: number | null;
          created_at?: string;
          customer_id: string;
          design_id: string;
          id?: string;
          nilai_proyek?: number | null;
          pengawas_id?: string | null;
          requirement_id?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
        };
        Update: {
          alamat_proyek?: string | null;
          budget_proyek?: number | null;
          created_at?: string;
          customer_id?: string;
          design_id?: string;
          id?: string;
          nilai_proyek?: number | null;
          pengawas_id?: string | null;
          requirement_id?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
        };
        Relationships: [];
      };
      project_documents: {
        Row: {
          catatan: string | null;
          created_at: string;
          id: string;
          jenis_dokumen: DocumentJenis;
          mime_type: string | null;
          nama_dokumen: string;
          project_id: string;
          review_status: "pending" | "approved" | "rejected";
          ukuran_bytes: number | null;
          uploaded_by: string;
          url: string;
        };
        Insert: {
          catatan?: string | null;
          created_at?: string;
          id?: string;
          jenis_dokumen: DocumentJenis;
          mime_type?: string | null;
          nama_dokumen: string;
          project_id: string;
          review_status?: "pending" | "approved" | "rejected";
          ukuran_bytes?: number | null;
          uploaded_by: string;
          url: string;
        };
        Update: {
          catatan?: string | null;
          created_at?: string;
          id?: string;
          jenis_dokumen?: DocumentJenis;
          mime_type?: string | null;
          nama_dokumen?: string;
          project_id?: string;
          review_status?: "pending" | "approved" | "rejected";
          ukuran_bytes?: number | null;
          uploaded_by?: string;
          url?: string;
        };
        Relationships: [];
      };
      mandor_profiles: {
        Row: {
          id: string;
          keahlian: string[];
          pengalaman_tahun: number | null;
          area_kerja: string | null;
          portofolio_url: string | null;
          status: Database["public"]["Enums"]["verifikasi_status"];
          created_at: string;
          ringkasan_pengalaman: string | null;
          proyek_sebelumnya: string | null;
          cv_path: string | null;
          catatan_verifikasi: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          id: string;
          keahlian?: string[];
          pengalaman_tahun?: number | null;
          area_kerja?: string | null;
          portofolio_url?: string | null;
          status?: Database["public"]["Enums"]["verifikasi_status"];
          created_at?: string;
          ringkasan_pengalaman?: string | null;
          proyek_sebelumnya?: string | null;
          cv_path?: string | null;
          catatan_verifikasi?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          id?: string;
          keahlian?: string[];
          pengalaman_tahun?: number | null;
          area_kerja?: string | null;
          portofolio_url?: string | null;
          status?: Database["public"]["Enums"]["verifikasi_status"];
          created_at?: string;
          ringkasan_pengalaman?: string | null;
          proyek_sebelumnya?: string | null;
          cv_path?: string | null;
          catatan_verifikasi?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
      };
      pengawas_profiles: {
        Row: {
          id: string;
          spesialisasi: string | null;
          aktif: boolean;
        };
        Insert: {
          id: string;
          spesialisasi?: string | null;
          aktif?: boolean;
        };
        Update: {
          id?: string;
          spesialisasi?: string | null;
          aktif?: boolean;
        };
      };
      project_mandors: {
        Row: {
          project_id: string;
          mandor_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          project_id: string;
          mandor_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          project_id?: string;
          mandor_id?: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          project_id: string;
          ruang_lingkup: string;
          spesifikasi: Json;
          nilai_kontrak: number;
          tanggal_mulai: string | null;
          tanggal_selesai_estimasi: string | null;
          tanggung_jawab: Json | null;
          ketentuan_perubahan: string | null;
          status: Database["public"]["Enums"]["contract_status"];
          signed_customer_at: string | null;
          signed_pengawas_at: string | null;
          signed_mandor_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          ruang_lingkup: string;
          spesifikasi?: Json;
          nilai_kontrak: number;
          tanggal_mulai?: string | null;
          tanggal_selesai_estimasi?: string | null;
          tanggung_jawab?: Json | null;
          ketentuan_perubahan?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          signed_customer_at?: string | null;
          signed_pengawas_at?: string | null;
          signed_mandor_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          ruang_lingkup?: string;
          spesifikasi?: Json;
          nilai_kontrak?: number;
          tanggal_mulai?: string | null;
          tanggal_selesai_estimasi?: string | null;
          tanggung_jawab?: Json | null;
          ketentuan_perubahan?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          signed_customer_at?: string | null;
          signed_pengawas_at?: string | null;
          signed_mandor_at?: string | null;
          created_at?: string;
        };
      };
      payment_stages: {
        Row: {
          id: string;
          project_id: string;
          nama_tahap: string;
          urutan: number;
          nominal: number;
          status: Database["public"]["Enums"]["payment_status"];
          tanggal_bayar: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          nama_tahap: string;
          urutan: number;
          nominal: number;
          status?: Database["public"]["Enums"]["payment_status"];
          tanggal_bayar?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          nama_tahap?: string;
          urutan?: number;
          nominal?: number;
          status?: Database["public"]["Enums"]["payment_status"];
          tanggal_bayar?: string | null;
        };
      };
      project_stages: {
        Row: {
          id: string;
          project_id: string;
          nama_tahap: string;
          urutan: number;
          progress_percentage: number;
          status: string;
          keterangan: string | null;
          tanggal_mulai: string | null;
          tanggal_selesai: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          nama_tahap: string;
          urutan?: number;
          progress_percentage?: number;
          status?: string;
          keterangan?: string | null;
          tanggal_mulai?: string | null;
          tanggal_selesai?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          nama_tahap?: string;
          urutan?: number;
          progress_percentage?: number;
          status?: string;
          keterangan?: string | null;
          tanggal_mulai?: string | null;
          tanggal_selesai?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      project_subtasks: {
        Row: {
          id: string;
          project_stage_id: string;
          judul: string;
          bobot: number;
          urutan: number;
          target_selesai: string | null;
          selesai: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_stage_id: string;
          judul: string;
          bobot?: number;
          urutan?: number;
          target_selesai?: string | null;
          selesai?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_stage_id?: string;
          judul?: string;
          bobot?: number;
          urutan?: number;
          target_selesai?: string | null;
          selesai?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      progress_reports: {
        Row: {
          id: string;
          project_stage_id: string;
          project_subtask_id: string | null;
          mandor_id: string;
          persentase: number;
          keterangan: string | null;
          foto_url: string | null;
          status: Database["public"]["Enums"]["report_status"];
          keputusan: string;
          feedback: string | null;
          revisi_ke: number;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_stage_id: string;
          project_subtask_id?: string | null;
          mandor_id: string;
          persentase: number;
          keterangan?: string | null;
          foto_url?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          keputusan?: string;
          feedback?: string | null;
          revisi_ke?: number;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_stage_id?: string;
          project_subtask_id?: string | null;
          mandor_id?: string;
          persentase?: number;
          keterangan?: string | null;
          foto_url?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          keputusan?: string;
          feedback?: string | null;
          revisi_ke?: number;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      kendala: {
        Row: {
          id: string;
          project_id: string;
          project_stage_id: string | null;
          project_subtask_id: string | null;
          reported_by: string;
          deskripsi: string;
          kategori: string | null;
          kondisi_pekerjaan: string | null;
          informasi_tambahan: string | null;
          lampiran: string | null;
          lampiran_nama: string | null;
          status: Database["public"]["Enums"]["kendala_status"];
          tindak_lanjut: string | null;
          dampak_biaya: number | null;
          dampak_waktu_hari: number | null;
          visible_to_customer: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          project_stage_id?: string | null;
          project_subtask_id?: string | null;
          reported_by: string;
          deskripsi: string;
          kategori?: string | null;
          kondisi_pekerjaan?: string | null;
          informasi_tambahan?: string | null;
          lampiran?: string | null;
          lampiran_nama?: string | null;
          status?: Database["public"]["Enums"]["kendala_status"];
          tindak_lanjut?: string | null;
          dampak_biaya?: number | null;
          dampak_waktu_hari?: number | null;
          visible_to_customer?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          project_stage_id?: string | null;
          project_subtask_id?: string | null;
          reported_by?: string;
          deskripsi?: string;
          kategori?: string | null;
          kondisi_pekerjaan?: string | null;
          informasi_tambahan?: string | null;
          lampiran?: string | null;
          lampiran_nama?: string | null;
          status?: Database["public"]["Enums"]["kendala_status"];
          tindak_lanjut?: string | null;
          dampak_biaya?: number | null;
          dampak_waktu_hari?: number | null;
          visible_to_customer?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      foreman_notes: {
        Row: {
          id: string;
          project_id: string;
          mandor_id: string;
          catatan: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          mandor_id: string;
          catatan: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          mandor_id?: string;
          catatan?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_available_mandor_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      submit_project: { Args: { pid: string }; Returns: undefined };
    };
    Enums: {
      contract_status: "draft" | "menunggu_ttd" | "aktif" | "selesai";
      kendala_status: "reported" | "reviewed" | "resolved";
      payment_status: "belum" | "lunas";
      project_status:
        | "draft"
        | "verifikasi_dokumen"
        | "revisi_dokumen"
        | "alokasi_mandor_pengawas"
        | "finalisasi_kontrak"
        | "pembayaran_dp"
        | "berjalan"
        | "selesai"
        | "batal";
      report_status: "pending" | "verified";
      user_role: "customer" | "admin" | "pengawas" | "mandor";
      verifikasi_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type UserRole = Database["public"]["Enums"]["user_role"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
