-- ============================================================
-- 006: Update project_status enum dengan alur yang lebih lengkap
-- ============================================================
-- Alur baru:
--   draft
--   -> verifikasi_dokumen      (setelah dokumen diunggah & diajukan)
--   -> revisi_dokumen          (dokumen ditolak, perlu direvisi customer)
--   -> alokasi_mandor_pengawas (dokumen disetujui, menunggu alokasi tim)
--   -> finalisasi_kontrak      (tim sudah dialokasikan, menunggu ttd kontrak)
--   -> pembayaran_dp           (kontrak ditandatangani, menunggu DP)
--   -> berjalan                (DP lunas, proyek aktif)
--   -> selesai                 (proyek selesai)
--   -> batal                   (dibatalkan oleh customer / admin sebelum kontrak)

-- ============================================================
-- LANGKAH 1: Drop semua policy yang bergantung pada kolom status
--            SEBELUM kita ubah tipe kolomnya
-- ============================================================
DROP POLICY IF EXISTS "projects_update"               ON public.projects;
DROP POLICY IF EXISTS "projects_customer_delete_draft" ON public.projects;
DROP POLICY IF EXISTS "projects_select"               ON public.projects;
DROP POLICY IF EXISTS "projects_customer_insert"      ON public.projects;

-- ============================================================
-- LANGKAH 2: Ganti enum type
-- ============================================================

-- 2a. Rename enum lama supaya tidak konflik
ALTER TYPE public.project_status RENAME TO project_status_old;

-- 2b. Buat enum baru dengan semua nilai
CREATE TYPE public.project_status AS ENUM (
  'draft',
  'verifikasi_dokumen',
  'revisi_dokumen',
  'alokasi_mandor_pengawas',
  'finalisasi_kontrak',
  'pembayaran_dp',
  'berjalan',
  'selesai',
  'batal'
);

-- ============================================================
-- LANGKAH 3: Migrasikan kolom status ke enum baru
-- ============================================================

-- 3a. Tambah kolom sementara dengan tipe baru
ALTER TABLE public.projects ADD COLUMN status_new public.project_status;

-- 3b. Migrasikan data lama ke nilai baru
UPDATE public.projects SET status_new =
  CASE status::text
    WHEN 'draft'              THEN 'draft'::public.project_status
    WHEN 'menunggu_pengawas'  THEN 'verifikasi_dokumen'::public.project_status
    WHEN 'kontrak'            THEN 'finalisasi_kontrak'::public.project_status
    WHEN 'berjalan'           THEN 'berjalan'::public.project_status
    WHEN 'selesai'            THEN 'selesai'::public.project_status
    WHEN 'batal'              THEN 'batal'::public.project_status
    ELSE 'draft'::public.project_status
  END;

-- 3c. Drop kolom lama (sudah aman karena policy sudah di-drop di langkah 1)
ALTER TABLE public.projects DROP COLUMN status;
ALTER TABLE public.projects RENAME COLUMN status_new TO status;

-- 3d. Set default & NOT NULL
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'draft'::public.project_status;
ALTER TABLE public.projects ALTER COLUMN status SET NOT NULL;

-- 3e. Hapus enum lama
DROP TYPE public.project_status_old;

-- ============================================================
-- LANGKAH 4: Buat ulang semua RLS policies
-- ============================================================

-- a. Customer boleh INSERT proyek miliknya
CREATE POLICY "projects_customer_insert" ON public.projects
FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

-- b. Customer & anggota proyek boleh SELECT proyek
CREATE POLICY "projects_select" ON public.projects
FOR SELECT TO authenticated
USING (
  customer_id = auth.uid()
  OR public.is_project_member(id)
);

-- c. Customer boleh DELETE proyek yang masih di tahap awal (sebelum finalisasi kontrak)
CREATE POLICY "projects_customer_delete_draft" ON public.projects
FOR DELETE TO authenticated
USING (
  customer_id = auth.uid()
  AND status IN ('draft', 'verifikasi_dokumen', 'revisi_dokumen')
);

-- d. Admin/pengawas boleh UPDATE status proyek (jika ada policy update)
--    Sesuaikan isi policy ini dengan kebutuhan bisnis Anda
CREATE POLICY "projects_update" ON public.projects
FOR UPDATE TO authenticated
USING (
  customer_id = auth.uid()
  OR public.is_project_member(id)
  OR public.get_my_role() = 'admin'
);

-- ============================================================
-- LANGKAH 5: Update fungsi submit_project()
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_project(pid uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = pid AND customer_id = auth.uid() AND status = 'draft'
  ) THEN
    RAISE EXCEPTION 'Proyek tidak ditemukan atau sudah diajukan';
  END IF;

  IF (
    SELECT COUNT(DISTINCT jenis_dokumen) FROM project_documents
    WHERE project_id = pid
      AND jenis_dokumen IN ('sertifikat_tanah', 'ktp_pemilik', 'imb_pbg')
  ) < 3 THEN
    RAISE EXCEPTION 'Dokumen wajib belum lengkap';
  END IF;

  UPDATE projects SET status = 'verifikasi_dokumen' WHERE id = pid;
END;
$$;
