export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DocumentJenis =
  "sertifikat_tanah" | "ktp_pemilik" | "imb_pbg" | "surat_kuasa";

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          alasan: string
          created_at: string
          design_id: string
          estimasi_biaya: number
          estimasi_durasi_hari: number
          id: string
          rank: number
          requirement_id: string
        }
        Insert: {
          alasan: string
          created_at?: string
          design_id: string
          estimasi_biaya: number
          estimasi_durasi_hari: number
          id?: string
          rank?: number
          requirement_id: string
        }
        Update: {
          alasan?: string
          created_at?: string
          design_id?: string
          estimasi_biaya?: number
          estimasi_durasi_hari?: number
          id?: string
          rank?: number
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "customer_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          company_signature_label: string
          created_at: string
          document_version: number
          id: string
          ketentuan_perubahan: string | null
          nilai_kontrak: number
          project_id: string
          ruang_lingkup: string
          signed_customer_at: string | null
          signed_customer_consent_at: string | null
          signed_customer_signature_path: string | null
          signed_mandor_at: string | null
          signed_pengawas_at: string | null
          signed_pengawas_signature_path: string | null
          spesifikasi: Json
          status: Database["public"]["Enums"]["contract_status"]
          tanggal_mulai: string | null
          tanggal_selesai_estimasi: string | null
          tanggung_jawab: Json | null
        }
        Insert: {
          company_signature_label?: string
          created_at?: string
          document_version?: number
          id?: string
          ketentuan_perubahan?: string | null
          nilai_kontrak: number
          project_id: string
          ruang_lingkup: string
          signed_customer_at?: string | null
          signed_customer_consent_at?: string | null
          signed_customer_signature_path?: string | null
          signed_mandor_at?: string | null
          signed_pengawas_at?: string | null
          signed_pengawas_signature_path?: string | null
          spesifikasi?: Json
          status?: Database["public"]["Enums"]["contract_status"]
          tanggal_mulai?: string | null
          tanggal_selesai_estimasi?: string | null
          tanggung_jawab?: Json | null
        }
        Update: {
          company_signature_label?: string
          created_at?: string
          document_version?: number
          id?: string
          ketentuan_perubahan?: string | null
          nilai_kontrak?: number
          project_id?: string
          ruang_lingkup?: string
          signed_customer_at?: string | null
          signed_customer_consent_at?: string | null
          signed_customer_signature_path?: string | null
          signed_mandor_at?: string | null
          signed_pengawas_at?: string | null
          signed_pengawas_signature_path?: string | null
          spesifikasi?: Json
          status?: Database["public"]["Enums"]["contract_status"]
          tanggal_mulai?: string | null
          tanggal_selesai_estimasi?: string | null
          tanggung_jawab?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_requirements: {
        Row: {
          budget: number
          created_at: string
          customer_id: string
          gaya_arsitektur: string | null
          id: string
          jumlah_kamar_mandi: number
          jumlah_kamar_tidur: number
          lokasi: string
          luas_tanah: number
        }
        Insert: {
          budget: number
          created_at?: string
          customer_id: string
          gaya_arsitektur?: string | null
          id?: string
          jumlah_kamar_mandi: number
          jumlah_kamar_tidur: number
          lokasi: string
          luas_tanah: number
        }
        Update: {
          budget?: number
          created_at?: string
          customer_id?: string
          gaya_arsitektur?: string | null
          id?: string
          jumlah_kamar_mandi?: number
          jumlah_kamar_tidur?: number
          lokasi?: string
          luas_tanah?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_requirements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      design_images: {
        Row: {
          design_id: string
          id: string
          url: string
          urutan: number
        }
        Insert: {
          design_id: string
          id?: string
          url: string
          urutan?: number
        }
        Update: {
          design_id?: string
          id?: string
          url?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_images_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
        ]
      }
      design_location_scores: {
        Row: {
          cocok: boolean
          created_at: string
          id: string
          lokasi: string
          nama: string
          peringkat_lokasi_untuk_desain: number | null
          skor_hujan: number | null
          skor_kecocokan_iklim: number | null
          skor_kelembapan: number | null
          skor_panas: number | null
          slug: string
        }
        Insert: {
          cocok?: boolean
          created_at?: string
          id?: string
          lokasi: string
          nama: string
          peringkat_lokasi_untuk_desain?: number | null
          skor_hujan?: number | null
          skor_kecocokan_iklim?: number | null
          skor_kelembapan?: number | null
          skor_panas?: number | null
          slug: string
        }
        Update: {
          cocok?: boolean
          created_at?: string
          id?: string
          lokasi?: string
          nama?: string
          peringkat_lokasi_untuk_desain?: number | null
          skor_hujan?: number | null
          skor_kecocokan_iklim?: number | null
          skor_kelembapan?: number | null
          skor_panas?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_design_location_scores_design"
            columns: ["slug"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["slug"]
          },
        ]
      }
      designs: {
        Row: {
          created_at: string
          created_by: string | null
          dasar_pemetaan: string[]
          deskripsi: string | null
          durasi_bulan: number | null
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
          dasar_pemetaan?: string[]
          deskripsi?: string | null
          durasi_bulan?: number | null
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
          dasar_pemetaan?: string[]
          deskripsi?: string | null
          durasi_bulan?: number | null
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
        Relationships: [
          {
            foreignKeyName: "designs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foreman_notes: {
        Row: {
          catatan: string
          created_at: string
          id: string
          mandor_id: string
          project_id: string
        }
        Insert: {
          catatan: string
          created_at?: string
          id?: string
          mandor_id: string
          project_id: string
        }
        Update: {
          catatan?: string
          created_at?: string
          id?: string
          mandor_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foreman_notes_mandor_id_fkey"
            columns: ["mandor_id"]
            isOneToOne: false
            referencedRelation: "mandor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foreman_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_resolutions: {
        Row: {
          alasan_persetujuan: string | null
          analisis_ai: Json | null
          bukti: string | null
          butuh_persetujuan: boolean
          created_at: string
          created_by: string
          disetujui_oleh: string | null
          disetujui_pada: string | null
          id: string
          kendala_id: string
          keputusan_final: boolean
          persetujuan_customer: string
          project_id: string
          solusi: string
          status: string
          sumber: string
          umpan_balik_customer: string | null
          updated_at: string
        }
        Insert: {
          alasan_persetujuan?: string | null
          analisis_ai?: Json | null
          bukti?: string | null
          butuh_persetujuan?: boolean
          created_at?: string
          created_by: string
          disetujui_oleh?: string | null
          disetujui_pada?: string | null
          id?: string
          kendala_id: string
          keputusan_final?: boolean
          persetujuan_customer?: string
          project_id: string
          solusi: string
          status?: string
          sumber?: string
          umpan_balik_customer?: string | null
          updated_at?: string
        }
        Update: {
          alasan_persetujuan?: string | null
          analisis_ai?: Json | null
          bukti?: string | null
          butuh_persetujuan?: boolean
          created_at?: string
          created_by?: string
          disetujui_oleh?: string | null
          disetujui_pada?: string | null
          id?: string
          kendala_id?: string
          keputusan_final?: boolean
          persetujuan_customer?: string
          project_id?: string
          solusi?: string
          status?: string
          sumber?: string
          umpan_balik_customer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_resolutions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_resolutions_disetujui_oleh_fkey"
            columns: ["disetujui_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_resolutions_kendala_id_fkey"
            columns: ["kendala_id"]
            isOneToOne: false
            referencedRelation: "kendala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_resolutions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kendala: {
        Row: {
          created_at: string
          dampak_biaya: number | null
          dampak_waktu_hari: number | null
          deskripsi: string
          id: string
          informasi_tambahan: string | null
          kategori: string | null
          kondisi_pekerjaan: string | null
          lampiran: string | null
          lampiran_nama: string | null
          project_id: string
          project_stage_id: string | null
          project_subtask_id: string | null
          reported_by: string
          status: Database["public"]["Enums"]["kendala_status"]
          tindak_lanjut: string | null
          updated_at: string | null
          visible_to_customer: boolean
        }
        Insert: {
          created_at?: string
          dampak_biaya?: number | null
          dampak_waktu_hari?: number | null
          deskripsi: string
          id?: string
          informasi_tambahan?: string | null
          kategori?: string | null
          kondisi_pekerjaan?: string | null
          lampiran?: string | null
          lampiran_nama?: string | null
          project_id: string
          project_stage_id?: string | null
          project_subtask_id?: string | null
          reported_by: string
          status?: Database["public"]["Enums"]["kendala_status"]
          tindak_lanjut?: string | null
          updated_at?: string | null
          visible_to_customer?: boolean
        }
        Update: {
          created_at?: string
          dampak_biaya?: number | null
          dampak_waktu_hari?: number | null
          deskripsi?: string
          id?: string
          informasi_tambahan?: string | null
          kategori?: string | null
          kondisi_pekerjaan?: string | null
          lampiran?: string | null
          lampiran_nama?: string | null
          project_id?: string
          project_stage_id?: string | null
          project_subtask_id?: string | null
          reported_by?: string
          status?: Database["public"]["Enums"]["kendala_status"]
          tindak_lanjut?: string | null
          updated_at?: string | null
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "kendala_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kendala_project_stage_id_fkey"
            columns: ["project_stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kendala_project_subtask_id_fkey"
            columns: ["project_subtask_id"]
            isOneToOne: false
            referencedRelation: "project_subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kendala_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "mandor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mandor_profiles: {
        Row: {
          area_kerja: string | null
          catatan_verifikasi: string | null
          created_at: string
          id: string
          keahlian: string[]
          pengalaman_tahun: number | null
          portofolio_url: string | null
          status: Database["public"]["Enums"]["verifikasi_status"]
        }
        Insert: {
          area_kerja?: string | null
          catatan_verifikasi?: string | null
          created_at?: string
          id: string
          keahlian?: string[]
          pengalaman_tahun?: number | null
          portofolio_url?: string | null
          status?: Database["public"]["Enums"]["verifikasi_status"]
        }
        Update: {
          area_kerja?: string | null
          catatan_verifikasi?: string | null
          created_at?: string
          id?: string
          keahlian?: string[]
          pengalaman_tahun?: number | null
          portofolio_url?: string | null
          status?: Database["public"]["Enums"]["verifikasi_status"]
        }
        Relationships: [
          {
            foreignKeyName: "mandor_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          isi: string | null
          judul: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          isi?: string | null
          judul: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          isi?: string | null
          judul?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_stages: {
        Row: {
          id: string
          nama_tahap: string
          nominal: number
          project_id: string
          status: Database["public"]["Enums"]["payment_status"]
          tanggal_bayar: string | null
          tanggal_jatuh_tempo: string | null
          urutan: number
        }
        Insert: {
          id?: string
          nama_tahap: string
          nominal: number
          project_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          tanggal_bayar?: string | null
          tanggal_jatuh_tempo?: string | null
          urutan: number
        }
        Update: {
          id?: string
          nama_tahap?: string
          nominal?: number
          project_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tanggal_bayar?: string | null
          tanggal_jatuh_tempo?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pengawas_profiles: {
        Row: {
          aktif: boolean
          id: string
          spesialisasi: string | null
        }
        Insert: {
          aktif?: boolean
          id: string
          spesialisasi?: string | null
        }
        Update: {
          aktif?: boolean
          id?: string
          spesialisasi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pengawas_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          nik: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          nik?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          nik?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      progress_documentation: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          project_id: string | null
          project_stage_id: string | null
          uploaded_by: string
          url: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          project_stage_id?: string | null
          uploaded_by: string
          url: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          project_stage_id?: string | null
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_documentation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_documentation_project_stage_id_fkey"
            columns: ["project_stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_documentation_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_reports: {
        Row: {
          created_at: string
          feedback: string | null
          foto_url: string | null
          id: string
          keputusan: string
          keterangan: string | null
          mandor_id: string | null
          persentase: number
          project_stage_id: string
          project_subtask_id: string | null
          reviewer_note: string | null
          revisi_ke: number
          status: Database["public"]["Enums"]["report_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          foto_url?: string | null
          id?: string
          keputusan?: string
          keterangan?: string | null
          mandor_id?: string | null
          persentase: number
          project_stage_id: string
          project_subtask_id?: string | null
          reviewer_note?: string | null
          revisi_ke?: number
          status?: Database["public"]["Enums"]["report_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          foto_url?: string | null
          id?: string
          keputusan?: string
          keterangan?: string | null
          mandor_id?: string | null
          persentase?: number
          project_stage_id?: string
          project_subtask_id?: string | null
          reviewer_note?: string | null
          revisi_ke?: number
          status?: Database["public"]["Enums"]["report_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_reports_mandor_id_fkey"
            columns: ["mandor_id"]
            isOneToOne: false
            referencedRelation: "mandor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_project_stage_id_fkey"
            columns: ["project_stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_project_subtask_id_fkey"
            columns: ["project_subtask_id"]
            isOneToOne: false
            referencedRelation: "project_subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "pengawas_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          review_status: string
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
          review_status?: string
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
          review_status?: string
          ukuran_bytes?: number | null
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_mandors: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          mandor_id: string
          project_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          mandor_id: string
          project_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          mandor_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_mandors_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_mandors_mandor_id_fkey"
            columns: ["mandor_id"]
            isOneToOne: false
            referencedRelation: "mandor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_mandors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          id: string
          keterangan: string | null
          nama_tahap: string
          progress_percentage: number
          project_id: string
          status: string
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          updated_at: string
          updated_by: string | null
          urutan: number
        }
        Insert: {
          id?: string
          keterangan?: string | null
          nama_tahap: string
          progress_percentage?: number
          project_id: string
          status?: string
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
          updated_by?: string | null
          urutan: number
        }
        Update: {
          id?: string
          keterangan?: string | null
          nama_tahap?: string
          progress_percentage?: number
          project_id?: string
          status?: string
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
          updated_by?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_subtasks: {
        Row: {
          bobot: number
          completed_at: string | null
          created_at: string
          id: string
          judul: string
          project_stage_id: string
          selesai: boolean
          target_selesai: string | null
          urutan: number
        }
        Insert: {
          bobot?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          judul: string
          project_stage_id: string
          selesai?: boolean
          target_selesai?: string | null
          urutan?: number
        }
        Update: {
          bobot?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          judul?: string
          project_stage_id?: string
          selesai?: boolean
          target_selesai?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_subtasks_project_stage_id_fkey"
            columns: ["project_stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          created_at: string
          id: string
          isi: string
          judul: string
          pengawas_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          isi: string
          judul: string
          pengawas_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          isi?: string
          judul?: string
          pengawas_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_pengawas_id_fkey"
            columns: ["pengawas_id"]
            isOneToOne: false
            referencedRelation: "pengawas_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_pengawas_id_fkey"
            columns: ["pengawas_id"]
            isOneToOne: false
            referencedRelation: "pengawas_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "customer_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_discussions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          penulis: string
          pesan: string
          resolution_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          penulis: string
          pesan: string
          resolution_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          penulis?: string
          pesan?: string
          resolution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_discussions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_discussions_resolution_id_fkey"
            columns: ["resolution_id"]
            isOneToOne: false
            referencedRelation: "issue_resolutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_progress_report: {
        Args: { report_id: string; review_note?: string }
        Returns: {
          created_at: string
          feedback: string | null
          foto_url: string | null
          id: string
          keputusan: string
          keterangan: string | null
          mandor_id: string | null
          persentase: number
          project_stage_id: string
          project_subtask_id: string | null
          reviewer_note: string | null
          revisi_ke: number
          status: Database["public"]["Enums"]["report_status"]
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "progress_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      customer_sign_contract: { Args: { pid: string }; Returns: undefined }
      get_available_mandor_ids: { Args: never; Returns: string[] }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_project_overall_progress: { Args: { pid: string }; Returns: number }
      get_user_email: { Args: { user_id: string }; Returns: string }
      initialize_project_stages: { Args: { pid: string }; Returns: undefined }
      is_project_mandor: { Args: { pid: string }; Returns: boolean }
      is_project_member: { Args: { pid: string }; Returns: boolean }
      is_project_pengawas: { Args: { pid: string }; Returns: boolean }
      reject_progress_report: {
        Args: { report_id: string; review_note: string }
        Returns: {
          created_at: string
          feedback: string | null
          foto_url: string | null
          id: string
          keputusan: string
          keterangan: string | null
          mandor_id: string | null
          persentase: number
          project_stage_id: string
          project_subtask_id: string | null
          reviewer_note: string | null
          revisi_ke: number
          status: Database["public"]["Enums"]["report_status"]
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "progress_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sign_project_contract: {
        Args: { pid: string; signature_path: string }
        Returns: undefined
      }
      sign_supervisor_contract: {
        Args: { pid: string; signature_path: string }
        Returns: undefined
      }
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
      report_status: "pending" | "verified" | "rejected"
      user_role: "customer" | "admin" | "pengawas" | "mandor"
      verifikasi_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      contract_status: ["draft", "menunggu_ttd", "aktif", "selesai"],
      kendala_status: ["reported", "reviewed", "resolved"],
      payment_status: ["belum", "lunas"],
      project_status: [
        "draft",
        "verifikasi_dokumen",
        "revisi_dokumen",
        "alokasi_mandor_pengawas",
        "finalisasi_kontrak",
        "pembayaran_dp",
        "berjalan",
        "selesai",
        "batal",
      ],
      report_status: ["pending", "verified", "rejected"],
      user_role: ["customer", "admin", "pengawas", "mandor"],
      verifikasi_status: ["pending", "approved", "rejected"],
    },
  },
} as const

export type UserRole = Database["public"]["Enums"]["user_role"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
