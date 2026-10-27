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
        Relationships: [
          {
            foreignKeyName: "designs_created_by_fkey",
            columns: ["created_by"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "design_images_design_id_fkey";
            columns: ["design_id"];
            isOneToOne: false;
            referencedRelation: "designs";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_design_id_fkey";
            columns: ["design_id"];
            isOneToOne: false;
            referencedRelation: "designs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_pengawas_id_fkey";
            columns: ["pengawas_id"];
            isOneToOne: false;
            referencedRelation: "pengawas_profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey",
            columns: ["uploaded_by"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
      };
      mandor_profiles: {
        Row: {
          id: string;
          keahlian: string[];
          pengalaman_tahun: number | null;
          area_kerja: string | null;
          portofolio_url: string | null;
          status: Database["public"]["Enums"]["verifikasi_status"];
          catatan_verifikasi: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          keahlian?: string[];
          pengalaman_tahun?: number | null;
          area_kerja?: string | null;
          portofolio_url?: string | null;
          status?: Database["public"]["Enums"]["verifikasi_status"];
          catatan_verifikasi?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          keahlian?: string[];
          pengalaman_tahun?: number | null;
          area_kerja?: string | null;
          portofolio_url?: string | null;
          status?: Database["public"]["Enums"]["verifikasi_status"];
          catatan_verifikasi?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mandor_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "pengawas_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "project_mandors_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_mandors_mandor_id_fkey";
            columns: ["mandor_id"];
            isOneToOne: false;
            referencedRelation: "mandor_profiles";
            referencedColumns: ["id"];
          }, 
          {
            foreignKeyName: "project_mandors_assigned_by_fkey",
            columns: ["assigned_by"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "contracts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
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
          tanggal_jatuh_tempo: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          nama_tahap: string;
          urutan: number;
          nominal: number;
          status?: Database["public"]["Enums"]["payment_status"];
          tanggal_bayar?: string | null;
          tanggal_jatuh_tempo?: string | null;
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
        Relationships: [
          {
            foreignKeyName: "payment_stages_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
        ];
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
          updated_by: string | null;
          updated_at: string;
          tanggal_mulai: string | null;
          tanggal_selesai: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          nama_tahap: string;
          urutan: number;
          progress_percentage?: number;
          status?: string;
          keterangan?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          tanggal_mulai?: string | null;
          tanggal_selesai?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          nama_tahap?: string;
          urutan?: number;
          progress_percentage?: number;
          status?: string;
          keterangan?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          tanggal_mulai?: string | null;
          tanggal_selesai?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "project_stages_updated_by_fkey",
            columns: ["updated_by"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "project_subtasks_project_stage_id_fkey",
            columns: ["project_stage_id"],
            referencedRelation: "project_stages",
            referencedColumns: ["id"],
          },
        ];
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
          keputusan: "menunggu" | "disetujui" | "perlu_revisi";
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
          keputusan?: "menunggu" | "disetujui" | "perlu_revisi";
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
          keputusan?: "menunggu" | "disetujui" | "perlu_revisi";
          feedback?: string | null;
          revisi_ke?: number;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_reports_project_stage_id_fkey",
            columns: ["project_stage_id"],
            referencedRelation: "project_stages",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "progress_reports_project_subtask_id_fkey",
            columns: ["project_subtask_id"],
            referencedRelation: "project_subtasks",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "progress_reports_mandor_id_fkey",
            columns: ["mandor_id"],
            referencedRelation: "mandor_profiles",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "progress_reports_verified_by_fkey",
            columns: ["verified_by"],
            referencedRelation: "pengawas_profiles",
            referencedColumns: ["id"],
          },
        ];
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
          status: Database["public"]["Enums"]["kendala_status"];
          tindak_lanjut: string | null;
          dampak_biaya: number | null;
          dampak_waktu_hari: number | null;
          visible_to_customer: boolean;
          informasi_tambahan: string | null;
          lampiran: string | null;
          lampiran_nama: string | null;
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
          status?: Database["public"]["Enums"]["kendala_status"];
          tindak_lanjut?: string | null;
          dampak_biaya?: number | null;
          dampak_waktu_hari?: number | null;
          visible_to_customer?: boolean;
          informasi_tambahan?: string | null;
          lampiran?: string | null;
          lampiran_nama?: string | null;
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
          status?: Database["public"]["Enums"]["kendala_status"];
          tindak_lanjut?: string | null;
          dampak_biaya?: number | null;
          dampak_waktu_hari?: number | null;
          visible_to_customer?: boolean;
          informasi_tambahan?: string | null;
          lampiran?: string | null;
          lampiran_nama?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kendala_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "kendala_project_stage_id_fkey",
            columns: ["project_stage_id"],
            referencedRelation: "project_stages",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "kendala_project_subtask_id_fkey",
            columns: ["project_subtask_id"],
            referencedRelation: "project_subtasks",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "kendala_reported_by_fkey",
            columns: ["reported_by"],
            referencedRelation: "mandor_profiles",
            referencedColumns: ["id"],
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "foreman_notes_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "foreman_notes_mandor_id_fkey",
            columns: ["mandor_id"],
            referencedRelation: "mandor_profiles",
            referencedColumns: ["id"],
          },
        ];
      };
      issue_resolutions: {
        Row: {
          id: string;
          project_id: string;
          kendala_id: string;
          solusi: string;
          sumber: "Pengawas" | "Analisis AI";
          analisis_ai: Json | null;
          status: string;
          butuh_persetujuan: boolean;
          alasan_persetujuan: string | null;
          bukti: string | null;
          umpan_balik_customer: string | null;
          persetujuan_customer:
            | "tidak_diminta"
            | "menunggu"
            | "disetujui"
            | "ditolak";
          disetujui_oleh: string | null;
          disetujui_pada: string | null;
          keputusan_final: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          kendala_id: string;
          solusi: string;
          sumber?: "Pengawas" | "Analisis AI";
          analisis_ai?: Json | null;
          status?: string;
          butuh_persetujuan?: boolean;
          alasan_persetujuan?: string | null;
          bukti?: string | null;
          umpan_balik_customer?: string | null;
          persetujuan_customer?:
            | "tidak_diminta"
            | "menunggu"
            | "disetujui"
            | "ditolak";
          disetujui_oleh?: string | null;
          disetujui_pada?: string | null;
          keputusan_final?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          kendala_id?: string;
          solusi?: string;
          sumber?: "Pengawas" | "Analisis AI";
          analisis_ai?: Json | null;
          status?: string;
          butuh_persetujuan?: boolean;
          alasan_persetujuan?: string | null;
          bukti?: string | null;
          umpan_balik_customer?: string | null;
          persetujuan_customer?:
            | "tidak_diminta"
            | "menunggu"
            | "disetujui"
            | "ditolak";
          disetujui_oleh?: string | null;
          disetujui_pada?: string | null;
          keputusan_final?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issue_resolutions_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "issue_resolutions_kendala_id_fkey",
            columns: ["kendala_id"],
            referencedRelation: "kendala",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "issue_resolutions_created_by_fkey",
            columns: ["created_by"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
      };
      resolution_discussions: {
        Row: {
          id: string;
          resolution_id: string;
          penulis: "Pengawas" | "Customer";
          pesan: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          resolution_id: string;
          penulis: "Pengawas" | "Customer";
          pesan: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          resolution_id?: string;
          penulis?: "Pengawas" | "Customer";
          pesan?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resolution_discussions_resolution_id_fkey",
            columns: ["resolution_id"],
            referencedRelation: "issue_resolutions",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "resolution_discussions_created_by_fkey",
            columns: ["created_by"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
      };
      progress_documentation: {
        Row: {
          id: string;
          project_stage_id: string | null;
          project_id: string | null;
          uploaded_by: string;
          url: string;
          catatan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_stage_id?: string | null;
          project_id?: string | null;
          uploaded_by: string;
          url: string;
          catatan?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_stage_id?: string | null;
          project_id?: string | null;
          uploaded_by?: string;
          url?: string;
          catatan?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_documentation_project_stage_id_fkey",
            columns: ["project_stage_id"],
            referencedRelation: "project_stages",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "progress_documentation_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "progress_documentation_uploaded_by_fkey",
            columns: ["uploaded_by"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
      };
      project_updates: {
        Row: {
          id: string;
          project_id: string;
          pengawas_id: string;
          judul: string;
          isi: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          pengawas_id: string;
          judul: string;
          isi: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          pengawas_id?: string;
          judul?: string;
          isi?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey",
            columns: ["project_id"],
            referencedRelation: "projects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "project_updates_pengawas_id_fkey",
            columns: ["pengawas_id"],
            referencedRelation: "pengawas_profiles",
            referencedColumns: ["id"],
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      customer_sign_contract: { Args: { pid: string }; Returns: undefined };
      get_available_mandor_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
        Relationships: [];
      };
      submit_project: { Args: { pid: string }; Returns: undefined };
      sign_project_contract: { Args: { pid: string }; Returns: undefined };
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
