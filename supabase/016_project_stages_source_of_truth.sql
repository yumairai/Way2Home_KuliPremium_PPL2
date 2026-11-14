-- Project stages are the only source of official project progress.
-- Apply after 014_progress_workflow.sql and 015_customer_tracking_connection.sql.

ALTER TABLE public.project_stages
  ADD COLUMN IF NOT EXISTS tanggal_mulai date,
  ADD COLUMN IF NOT EXISTS tanggal_selesai date;

ALTER TABLE public.progress_reports
  ADD COLUMN IF NOT EXISTS reviewer_note text,
  ADD COLUMN IF NOT EXISTS keputusan text NOT NULL DEFAULT 'menunggu',
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS revisi_ke int NOT NULL DEFAULT 1;

-- This intentionally fails if legacy duplicate stage orders exist. They must be
-- resolved explicitly instead of being silently merged or deleted.
CREATE UNIQUE INDEX IF NOT EXISTS project_stages_project_order_key
  ON public.project_stages(project_id, urutan);

CREATE OR REPLACE FUNCTION public.initialize_project_stages(pid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_stages (project_id, nama_tahap, urutan)
  VALUES
    (pid, 'Persiapan', 1),
    (pid, 'Pondasi', 2),
    (pid, 'Struktur', 3),
    (pid, 'Dinding & Atap', 4),
    (pid, 'Finishing', 5),
    (pid, 'Serah Terima', 6)
  ON CONFLICT (project_id, urutan) DO NOTHING;
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

DO $$
DECLARE
  project_record record;
BEGIN
  FOR project_record IN
    SELECT id
    FROM public.projects
    WHERE status::text IN ('berjalan', 'kontrak', 'pembayaran_dp')
  LOOP
    PERFORM public.initialize_project_stages(project_record.id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_project_overall_progress(pid uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stage_count integer;
  progress_total numeric;
BEGIN
  SELECT count(*), COALESCE(sum(progress_percentage), 0)
    INTO stage_count, progress_total
  FROM public.project_stages
  WHERE project_id = pid
    AND urutan BETWEEN 1 AND 6;

  IF stage_count <> 6 THEN
    RETURN NULL;
  END IF;

  RETURN ROUND(progress_total / 6, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_progress_report(
  report_id uuid,
  review_note text DEFAULT NULL
)
RETURNS public.progress_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_row public.progress_reports;
  stage_row public.project_stages;
  project_supervisor uuid;
BEGIN
  SELECT pr.*
    INTO report_row
  FROM public.progress_reports pr
  WHERE pr.id = report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Laporan progress tidak ditemukan';
  END IF;

  IF report_row.status::text <> 'pending' THEN
    RAISE EXCEPTION 'Laporan hanya dapat disetujui saat berstatus pending';
  END IF;

  SELECT ps.*
    INTO stage_row
  FROM public.project_stages ps
  WHERE ps.id = report_row.project_stage_id
  FOR UPDATE OF ps;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tahap proyek untuk laporan tidak ditemukan';
  END IF;

  SELECT p.pengawas_id
    INTO project_supervisor
  FROM public.projects p
  WHERE p.id = stage_row.project_id;

  IF public.get_my_role() <> 'admin'
     AND (public.get_my_role() <> 'pengawas'
          OR project_supervisor <> auth.uid()) THEN
    RAISE EXCEPTION 'Pengguna tidak berwenang memverifikasi laporan ini';
  END IF;

  IF report_row.persentase < stage_row.progress_percentage THEN
    RAISE EXCEPTION
      'Progress tidak boleh turun dari progress resmi saat ini (%).',
      stage_row.progress_percentage;
  END IF;

  UPDATE public.progress_reports
  SET status = 'verified',
      keputusan = 'disetujui',
      reviewer_note = COALESCE(review_note, reviewer_note),
      feedback = COALESCE(review_note, feedback),
      verified_by = auth.uid(),
      verified_at = now()
  WHERE id = report_id
  RETURNING * INTO report_row;

  UPDATE public.project_stages
  SET progress_percentage = report_row.persentase,
      status = CASE
        WHEN report_row.persentase = 0 THEN 'belum_mulai'
        WHEN report_row.persentase = 100 THEN 'selesai'
        ELSE 'berjalan'
      END,
      keterangan = COALESCE(report_row.keterangan, keterangan),
      updated_by = auth.uid(),
      updated_at = now(),
      tanggal_mulai = CASE
        WHEN report_row.persentase > 0 THEN COALESCE(tanggal_mulai, CURRENT_DATE)
        ELSE tanggal_mulai
      END,
      tanggal_selesai = CASE
        WHEN report_row.persentase = 100 THEN COALESCE(tanggal_selesai, CURRENT_DATE)
        ELSE tanggal_selesai
      END
  WHERE id = report_row.project_stage_id;

  RETURN report_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_progress_report(
  report_id uuid,
  review_note text
)
RETURNS public.progress_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_row public.progress_reports;
  project_supervisor uuid;
BEGIN
  SELECT pr.*
    INTO report_row
  FROM public.progress_reports pr
  WHERE pr.id = report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Laporan progress tidak ditemukan';
  END IF;

  SELECT p.pengawas_id
    INTO project_supervisor
  FROM public.projects p
  JOIN public.project_stages ps ON ps.project_id = p.id
  WHERE ps.id = report_row.project_stage_id;

  IF report_row.status::text <> 'pending' THEN
    RAISE EXCEPTION 'Laporan hanya dapat ditolak saat berstatus pending';
  END IF;

  IF public.get_my_role() <> 'admin'
     AND (public.get_my_role() <> 'pengawas'
          OR project_supervisor <> auth.uid()) THEN
    RAISE EXCEPTION 'Pengguna tidak berwenang menolak laporan ini';
  END IF;

  UPDATE public.progress_reports
  SET status = 'rejected',
      keputusan = 'ditolak',
      reviewer_note = review_note,
      feedback = review_note,
      verified_by = auth.uid(),
      verified_at = now()
  WHERE id = report_id
  RETURNING * INTO report_row;

  RETURN report_row;
END;
$$;

-- Remove the old status trigger: approval RPCs update the report and stage in
-- one transaction and therefore cannot notify or apply the same report twice.
DROP TRIGGER IF EXISTS apply_verified_progress_on_report
  ON public.progress_reports;

DROP POLICY IF EXISTS "stages_pengawas_write" ON public.project_stages;
DROP POLICY IF EXISTS "stages_select" ON public.project_stages;
CREATE POLICY "stages_select" ON public.project_stages
  FOR SELECT USING (is_project_member(project_id));

DROP POLICY IF EXISTS "progress_select" ON public.progress_reports;
CREATE POLICY "progress_select" ON public.progress_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.project_stages ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = project_stage_id
        AND (
          (p.customer_id = auth.uid() AND progress_reports.status::text = 'verified')
          OR p.pengawas_id = auth.uid()
          OR mandor_id = auth.uid()
          OR public.get_my_role() = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "progress_pengawas_verify" ON public.progress_reports;
DROP POLICY IF EXISTS "progress_pengawas_insert" ON public.progress_reports;
REVOKE UPDATE ON public.project_stages FROM authenticated;
REVOKE UPDATE ON public.progress_reports FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_progress_report(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_progress_report(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_overall_progress(uuid) TO authenticated;
