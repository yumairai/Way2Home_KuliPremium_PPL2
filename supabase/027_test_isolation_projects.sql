-- RLS policies for test mode isolation - Projects
-- Core project access with mode boundaries

DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_customer_insert ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_customer_delete_draft ON public.projects;

-- Project visibility: same-mode projects where user is member
CREATE POLICY projects_select ON public.projects
FOR SELECT TO authenticated
USING (
  public.project_mode_matches(id) AND 
  (customer_id = auth.uid() OR pengawas_id = auth.uid() OR public.is_project_mandor(id))
);

-- Project creation: customer's own mode
CREATE POLICY projects_customer_insert ON public.projects
FOR INSERT TO authenticated
WITH CHECK (
  customer_id = auth.uid() AND 
  public.is_test_user() = (SELECT p.is_test_user FROM public.profiles p WHERE p.id = auth.uid())
);

-- Project updates: same-mode, customer or supervisor only
CREATE POLICY projects_update ON public.projects
FOR UPDATE TO authenticated
USING (public.project_mode_matches(id) AND (customer_id = auth.uid() OR pengawas_id = auth.uid()))
WITH CHECK (public.project_mode_matches(id) AND (customer_id = auth.uid() OR pengawas_id = auth.uid()));

-- Project deletion: same-mode, customer draft projects without signed contract
CREATE POLICY projects_customer_delete_draft ON public.projects
FOR DELETE TO authenticated
USING (
  customer_id = auth.uid() AND 
  public.project_mode_matches(id) AND 
  status IN ('draft','verifikasi_dokumen','revisi_dokumen','alokasi_mandor_pengawas','finalisasi_kontrak') AND
  NOT EXISTS (
    SELECT 1 FROM public.contracts c 
    WHERE c.project_id = projects.id AND 
    (c.signed_customer_at IS NOT NULL OR c.status IN ('aktif','selesai'))
  )
);

COMMENT ON POLICY projects_select ON public.projects IS 'Test isolation: users only see projects where owner mode matches their mode.';
