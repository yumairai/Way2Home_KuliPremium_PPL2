-- RLS policies for test mode isolation - Nested tables
-- project_subtasks, progress_reports, progress_documentation, resolution_discussions

-- Drop existing policies
DO $$ 
DECLARE 
  t text;
  pol record;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'project_subtasks','progress_reports','progress_documentation','resolution_discussions'
  ]) 
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename=t 
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- project_subtasks (linked via project_stages)
CREATE POLICY project_subtasks_test_select ON public.project_subtasks
FOR SELECT TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = project_subtasks.project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND public.is_project_member(s.project_id)
  )
);

CREATE POLICY project_subtasks_test_staff_manage ON public.project_subtasks
FOR ALL TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = project_subtasks.project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND public.is_project_pengawas(s.project_id)
  )
)
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = project_subtasks.project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND public.is_project_pengawas(s.project_id)
  )
);

-- progress_reports (linked via project_stages)
CREATE POLICY progress_reports_test_select ON public.progress_reports
FOR SELECT TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND (
        (s.project_id IN (SELECT p.id FROM public.projects p WHERE p.customer_id = auth.uid()) 
         AND status = 'verified') 
        OR public.is_project_pengawas(s.project_id) 
        OR public.is_project_mandor(s.project_id)
      )
  )
);

CREATE POLICY progress_reports_test_insert ON public.progress_reports
FOR INSERT TO authenticated
WITH CHECK (
  mandor_id = auth.uid() AND 
  EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND public.is_project_mandor(s.project_id)
  )
);

CREATE POLICY progress_reports_test_update ON public.progress_reports
FOR UPDATE TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND public.is_project_pengawas(s.project_id)
  )
)
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND public.is_project_pengawas(s.project_id)
  )
);

-- progress_documentation (can link to project or project_stage)
CREATE POLICY progress_documentation_test_select ON public.progress_documentation
FOR SELECT TO authenticated
USING (
  (project_id IS NOT NULL AND public.project_mode_matches(project_id) AND public.is_project_member(project_id))
  OR
  (project_stage_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.project_stages s 
    WHERE s.id = progress_documentation.project_stage_id 
      AND public.project_mode_matches(s.project_id) 
      AND public.is_project_member(s.project_id)
  ))
);

CREATE POLICY progress_documentation_test_insert ON public.progress_documentation
FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND 
  (
    (project_id IS NOT NULL 
     AND public.project_mode_matches(project_id) 
     AND (public.is_project_pengawas(project_id) OR public.is_project_mandor(project_id)))
    OR
    (project_stage_id IS NOT NULL AND EXISTS(
      SELECT 1 FROM public.project_stages s 
      WHERE s.id = progress_documentation.project_stage_id 
        AND public.project_mode_matches(s.project_id) 
        AND (public.is_project_pengawas(s.project_id) OR public.is_project_mandor(s.project_id))
    ))
  )
);

-- resolution_discussions (linked via issue_resolutions)
CREATE POLICY resolution_discussions_test_select ON public.resolution_discussions
FOR SELECT TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.issue_resolutions r 
    WHERE r.id = resolution_discussions.resolution_id 
      AND public.project_mode_matches(r.project_id) 
      AND public.is_project_member(r.project_id)
  )
);

CREATE POLICY resolution_discussions_test_insert ON public.resolution_discussions
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND 
  EXISTS(
    SELECT 1 FROM public.issue_resolutions r 
    WHERE r.id = resolution_discussions.resolution_id 
      AND public.project_mode_matches(r.project_id) 
      AND public.is_project_member(r.project_id)
  )
);

COMMENT ON POLICY progress_reports_test_select ON public.progress_reports IS 
'Test isolation: customer only sees verified reports from same-mode projects; staff see all reports in assigned projects.';
