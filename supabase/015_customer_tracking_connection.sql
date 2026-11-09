-- ============================================================
-- 015_customer_tracking_connection.sql
--
-- Menghubungkan alur backend Mandor -> Pengawas -> Customer
-- untuk progress tracking proyek bangun rumah.
--
-- Dibuat idempotent & self-contained:
-- mencakup semua tabel, kolom, dan RLS yang dibutuhkan.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tambah nilai enum report_status jika belum ada
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'report_status' AND e.enumlabel = 'rejected'
  ) THEN
    ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'rejected';
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 2. Kolom tanggal pada project_stages
-- ------------------------------------------------------------
ALTER TABLE public.project_stages
  ADD COLUMN IF NOT EXISTS tanggal_mulai date,
  ADD COLUMN IF NOT EXISTS tanggal_selesai date;

-- ------------------------------------------------------------
-- 3. Tabel project_subtasks (subtask per tahap dengan bobot)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_stage_id uuid NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  judul text NOT NULL,
  bobot numeric NOT NULL DEFAULT 0 CHECK (bobot >= 0),
  urutan int NOT NULL DEFAULT 0,
  target_selesai date,
  selesai boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_stage
  ON public.project_subtasks(project_stage_id);

-- ------------------------------------------------------------
-- 4. Kolom keputusan, subtask, feedback pada progress_reports
-- ------------------------------------------------------------
ALTER TABLE public.progress_reports
  ADD COLUMN IF NOT EXISTS project_subtask_id uuid REFERENCES public.project_subtasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS keputusan text NOT NULL DEFAULT 'menunggu',
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS revisi_ke int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reviewer_note text;

-- Mandor_id boleh null jika pengawas membuat laporan langsung
ALTER TABLE public.progress_reports ALTER COLUMN mandor_id DROP NOT NULL;

-- ------------------------------------------------------------
-- 5. Kolom project_id pada progress_documentation
-- ------------------------------------------------------------
ALTER TABLE public.progress_documentation
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.progress_documentation
  ALTER COLUMN project_stage_id DROP NOT NULL;

-- ------------------------------------------------------------
-- 6. Tabel foreman_notes (catatan mandor untuk pengawas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.foreman_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mandor_id uuid NOT NULL REFERENCES public.mandor_profiles(id),
  catatan text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foreman_notes_project
  ON public.foreman_notes(project_id);

-- ------------------------------------------------------------
-- 7. Trigger sinkronisasi progres resmi saat pengawas approve
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_verified_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stage_project_id uuid;
  next_progress int;
BEGIN
  IF NEW.status <> 'verified' THEN
    RETURN NEW;
  END IF;

  SELECT ps.project_id INTO stage_project_id
  FROM public.project_stages ps
  WHERE ps.id = NEW.project_stage_id;

  SELECT COALESCE(MAX(pr.persentase), 0)
    INTO next_progress
  FROM public.progress_reports pr
  WHERE pr.project_stage_id = NEW.project_stage_id
    AND pr.status = 'verified';

  UPDATE public.project_stages
  SET progress_percentage = next_progress,
      status = CASE
        WHEN next_progress = 0 THEN 'belum_mulai'
        WHEN next_progress = 100 THEN 'selesai'
        ELSE 'berjalan'
      END,
      keterangan = COALESCE(NEW.keterangan, keterangan),
      updated_by = NEW.verified_by,
      updated_at = now()
  WHERE id = NEW.project_stage_id;

  -- Kirim notifikasi ke customer
  INSERT INTO public.notifications (user_id, judul, isi)
  SELECT p.customer_id,
         'Progress proyek diperbarui',
         'Progress tahap proyek telah diverifikasi oleh pengawas.'
  FROM public.projects p
  WHERE p.id = stage_project_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_verified_progress_on_report
  ON public.progress_reports;
CREATE TRIGGER apply_verified_progress_on_report
  AFTER INSERT OR UPDATE OF status ON public.progress_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_verified_progress();

-- ------------------------------------------------------------
-- 8. RLS Policies
-- ------------------------------------------------------------
ALTER TABLE public.project_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foreman_notes ENABLE ROW LEVEL SECURITY;

-- Subtasks:
DROP POLICY IF EXISTS "subtasks_select" ON public.project_subtasks;
CREATE POLICY "subtasks_select" ON public.project_subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = project_stage_id AND is_project_member(ps.project_id)
    )
  );

DROP POLICY IF EXISTS "subtasks_pengawas_manage" ON public.project_subtasks;
CREATE POLICY "subtasks_pengawas_manage" ON public.project_subtasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = project_stage_id
        AND (is_project_pengawas(ps.project_id) OR get_my_role() = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = project_stage_id
        AND (is_project_pengawas(ps.project_id) OR get_my_role() = 'admin')
    )
  );

-- Progress reports:
DROP POLICY IF EXISTS "progress_select" ON public.progress_reports;
CREATE POLICY "progress_select" ON public.progress_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_stages ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = project_stage_id
        AND (
          -- Customer HANYA melihat progress yang berstatus verified
          (get_my_role() = 'customer' AND p.customer_id = auth.uid() AND progress_reports.status::text = 'verified')
          -- Pengawas melihat semua laporan proyek yang diawasinya
          OR p.pengawas_id = auth.uid()
          -- Mandor melihat laporan proyeknya
          OR mandor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_mandors pm
            WHERE pm.project_id = p.id AND pm.mandor_id = auth.uid()
          )
          -- Admin melihat semua
          OR get_my_role() = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "progress_mandor_insert" ON public.progress_reports;
CREATE POLICY "progress_mandor_insert" ON public.progress_reports
  FOR INSERT WITH CHECK (
    mandor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = project_stage_id AND is_project_mandor(ps.project_id)
    )
  );

DROP POLICY IF EXISTS "progress_pengawas_insert" ON public.progress_reports;
CREATE POLICY "progress_pengawas_insert" ON public.progress_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = project_stage_id
        AND (is_project_pengawas(ps.project_id) OR get_my_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "progress_pengawas_verify" ON public.progress_reports;
CREATE POLICY "progress_pengawas_verify" ON public.progress_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = project_stage_id
        AND (is_project_pengawas(ps.project_id) OR get_my_role() = 'admin')
    )
  )
  WITH CHECK (
    status::text IN ('verified', 'pending', 'rejected')
  );

-- Documentation:
DROP POLICY IF EXISTS "documentation_select" ON public.progress_documentation;
CREATE POLICY "documentation_select" ON public.progress_documentation
  FOR SELECT USING (
    (project_id IS NOT NULL AND is_project_member(project_id))
    OR
    (
      project_stage_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.project_stages ps
        WHERE ps.id = project_stage_id AND is_project_member(ps.project_id)
      )
    )
  );

DROP POLICY IF EXISTS "documentation_insert" ON public.progress_documentation;
CREATE POLICY "documentation_insert" ON public.progress_documentation
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      (project_id IS NOT NULL AND (is_project_pengawas(project_id) OR is_project_mandor(project_id)))
      OR
      (
        project_stage_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.project_stages ps
          WHERE ps.id = project_stage_id
            AND (is_project_pengawas(ps.project_id) OR is_project_mandor(ps.project_id))
        )
      )
    )
  );

-- Project updates:
DROP POLICY IF EXISTS "updates_select" ON public.project_updates;
CREATE POLICY "updates_select" ON public.project_updates
  FOR SELECT USING (is_project_member(project_id));

DROP POLICY IF EXISTS "updates_pengawas_insert" ON public.project_updates;
CREATE POLICY "updates_pengawas_insert" ON public.project_updates
  FOR INSERT WITH CHECK (
    pengawas_id = auth.uid() AND is_project_pengawas(project_id)
  );

-- Foreman notes:
DROP POLICY IF EXISTS "foreman_notes_select" ON public.foreman_notes;
CREATE POLICY "foreman_notes_select" ON public.foreman_notes
  FOR SELECT USING (is_project_member(project_id));

DROP POLICY IF EXISTS "foreman_notes_mandor_insert" ON public.foreman_notes;
CREATE POLICY "foreman_notes_mandor_insert" ON public.foreman_notes
  FOR INSERT WITH CHECK (mandor_id = auth.uid() AND is_project_mandor(project_id));

-- ------------------------------------------------------------
-- 9. Grants
-- ------------------------------------------------------------
GRANT SELECT, UPDATE ON public.project_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_subtasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.progress_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.progress_documentation TO authenticated;
GRANT SELECT, INSERT ON public.project_updates TO authenticated;
GRANT SELECT, INSERT ON public.foreman_notes TO authenticated;
