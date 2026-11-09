-- Progress workflow:
-- mandor submits pending reports, pengawas reviews them, and only verified
-- reports update the official stage progress visible to customers.

ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'rejected';

ALTER TABLE public.progress_reports
  ADD COLUMN IF NOT EXISTS reviewer_note text;

CREATE OR REPLACE FUNCTION public.initialize_project_stages(pid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_stages (project_id, nama_tahap, urutan)
  SELECT pid, stage.nama_tahap, stage.urutan
  FROM (VALUES
    ('Persiapan', 1),
    ('Pondasi', 2),
    ('Struktur', 3),
    ('Dinding & Atap', 4),
    ('Finishing', 5),
    ('Serah Terima', 6)
  ) AS stage(nama_tahap, urutan)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.project_stages ps WHERE ps.project_id = pid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_stages_on_project_start()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status::text IN ('berjalan', 'kontrak', 'pembayaran_dp') THEN
    PERFORM public.initialize_project_stages(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS initialize_project_stages_on_project_status
  ON public.projects;
CREATE TRIGGER initialize_project_stages_on_project_status
  AFTER INSERT OR UPDATE OF status ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_stages_on_project_start();

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

ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_select" ON public.progress_reports;
CREATE POLICY "progress_select" ON public.progress_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_stages ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = project_stage_id
        AND (
          p.customer_id = auth.uid() AND progress_reports.status::text = 'verified'
          OR p.pengawas_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_mandors pm
            WHERE pm.project_id = p.id AND pm.mandor_id = auth.uid()
          )
          OR public.get_my_role() = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "progress_pengawas_verify" ON public.progress_reports;
CREATE POLICY "progress_pengawas_verify" ON public.progress_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = project_stage_id
        AND public.is_project_pengawas(ps.project_id)
    )
    OR public.get_my_role() = 'admin'
  )
  WITH CHECK (status::text IN ('verified', 'rejected'));

GRANT SELECT, INSERT, UPDATE ON public.project_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.progress_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_project_stages(uuid) TO authenticated;

DO $$
DECLARE project_record record;
BEGIN
  FOR project_record IN
    SELECT id FROM public.projects
    WHERE status::text IN ('berjalan', 'kontrak', 'pembayaran_dp')
  LOOP
    PERFORM public.initialize_project_stages(project_record.id);
  END LOOP;
END;
$$;
