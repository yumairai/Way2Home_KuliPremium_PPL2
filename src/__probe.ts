import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

declare const supabase: SupabaseClient<Database>;

const q1 = supabase.from("projects").select(`
  id,
  status,
  alamat_proyek,
  nilai_proyek,
  created_at,
  designs ( nama, gaya_arsitektur, deskripsi, luas_tanah, luas_bangunan, jumlah_kamar_tidur, jumlah_kamar_mandi, jumlah_lantai ),
  contracts ( id, nilai_kontrak, tanggal_mulai, tanggal_selesai_estimasi ),
  profiles!projects_customer_id_fkey ( full_name, phone ),
  pengawas_profiles ( profiles!pengawas_profiles_id_fkey ( full_name ) ),
  project_mandors ( mandor_id, mandor_profiles ( profiles!mandor_profiles_id_fkey ( full_name ) ) ),
  payment_stages ( id, nama_tahap, urutan, nominal, status, tanggal_bayar )
`);

const q2 = supabase.from("projects").select(`
  id,
  status,
  alamat_proyek,
  created_at,
  nilai_proyek,
  designs ( nama, gaya_arsitektur, lokasi, design_images ( url, urutan ) ),
  contracts ( ruang_lingkup, tanggal_mulai, tanggal_selesai_estimasi, nilai_kontrak ),
  pengawas_profiles ( profiles!pengawas_profiles_id_fkey ( full_name ) ),
  project_mandors ( mandor_id, assigned_at )
`);

const q3 = supabase.from("progress_reports").select(`
  id,
  project_stage_id,
  project_subtask_id,
  persentase,
  keterangan,
  foto_url,
  keputusan,
  feedback,
  created_at,
  project_stages ( id, nama_tahap ),
  project_subtasks ( id, judul, bobot ),
  mandor_profiles ( profiles!mandor_profiles_id_fkey ( full_name ) )
`);

type IsErr<T> = T extends { SelectQueryError: string } ? true : false;
type AnyErr<Rows> = Rows extends (infer R)[] ? IsErr<R> : false;

type D1 = NonNullable<Awaited<typeof q1>["data"]>;
type D2 = NonNullable<Awaited<typeof q2>["data"]>;
type D3 = NonNullable<Awaited<typeof q3>["data"]>;

export const c1: AnyErr<D1> = false;
export const c2: AnyErr<D2> = false;
export const c3: AnyErr<D3> = false;
