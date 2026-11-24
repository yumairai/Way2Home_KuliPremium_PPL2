-- RLS policies for test mode isolation - Child tables
-- project_documents, project_mandors, contracts, payment_stages, project_stages, 
-- project_updates, kendala, issue_resolutions, foreman_notes

-- Drop existing policies on these tables
DO $$ 
DECLARE 
  t text;
  pol record;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'project_documents','project_mandors','contracts','payment_stages',
    'project_stages','project_updates','kendala','issue_resolutions','foreman_notes'
  ]) 
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename=t 
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- project_documents
CREATE POLICY project_documents_test_isolation_select ON public.project_documents
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY project_documents_test_insert ON public.project_documents
FOR INSERT TO authenticated
WITH CHECK (
  public.project_mode_matches(project_id) AND 
  (uploaded_by = auth.uid() OR public.get_my_role() = 'admin')
);

CREATE POLICY project_documents_test_update ON public.project_documents
FOR UPDATE TO authenticated
USING (public.project_mode_matches(project_id) AND (uploaded_by = auth.uid() OR public.is_project_pengawas(project_id)))
WITH CHECK (public.project_mode_matches(project_id) AND (uploaded_by = auth.uid() OR public.is_project_pengawas(project_id)));

CREATE POLICY project_documents_test_delete ON public.project_documents
FOR DELETE TO authenticated
USING (public.project_mode_matches(project_id) AND (uploaded_by = auth.uid() OR public.is_project_pengawas(project_id)));

-- project_mandors
CREATE POLICY project_mandors_test_isolation_select ON public.project_mandors
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY project_mandors_test_manage ON public.project_mandors
FOR ALL TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id))
WITH CHECK (
  public.project_mode_matches(project_id) AND 
  public.is_project_pengawas(project_id) AND 
  EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = mandor_id AND p.is_test_user = public.is_test_user())
);

-- contracts
CREATE POLICY contracts_test_isolation_select ON public.contracts
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY contracts_test_staff_write ON public.contracts
FOR ALL TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id))
WITH CHECK (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id));

CREATE POLICY contracts_test_customer_sign ON public.contracts
FOR UPDATE TO authenticated
USING (
  public.project_mode_matches(project_id) AND 
  EXISTS(SELECT 1 FROM public.projects p WHERE p.id = contracts.project_id AND p.customer_id = auth.uid())
)
WITH CHECK (
  public.project_mode_matches(project_id) AND 
  EXISTS(SELECT 1 FROM public.projects p WHERE p.id = contracts.project_id AND p.customer_id = auth.uid())
);

-- payment_stages
CREATE POLICY payment_stages_test_isolation_select ON public.payment_stages
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY payment_stages_test_write ON public.payment_stages
FOR ALL TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id))
WITH CHECK (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id));

-- project_stages
CREATE POLICY project_stages_test_isolation_select ON public.project_stages
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY project_stages_test_staff_write ON public.project_stages
FOR ALL TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id))
WITH CHECK (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id));

-- project_updates
CREATE POLICY project_updates_test_isolation_select ON public.project_updates
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY project_updates_test_insert ON public.project_updates
FOR INSERT TO authenticated
WITH CHECK (
  public.project_mode_matches(project_id) AND 
  pengawas_id = auth.uid() AND 
  public.is_project_pengawas(project_id)
);

-- kendala
CREATE POLICY kendala_test_isolation_select ON public.kendala
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY kendala_test_insert ON public.kendala
FOR INSERT TO authenticated
WITH CHECK (
  public.project_mode_matches(project_id) AND 
  reported_by = auth.uid() AND 
  public.is_project_mandor(project_id)
);

CREATE POLICY kendala_test_update ON public.kendala
FOR UPDATE TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id))
WITH CHECK (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id));

-- issue_resolutions
CREATE POLICY issue_resolutions_test_isolation_select ON public.issue_resolutions
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY issue_resolutions_test_staff_manage ON public.issue_resolutions
FOR ALL TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id))
WITH CHECK (public.project_mode_matches(project_id) AND public.is_project_pengawas(project_id));

CREATE POLICY issue_resolutions_test_customer_decide ON public.issue_resolutions
FOR UPDATE TO authenticated
USING (
  public.project_mode_matches(project_id) AND 
  EXISTS(SELECT 1 FROM public.projects p WHERE p.id = issue_resolutions.project_id AND p.customer_id = auth.uid())
)
WITH CHECK (
  public.project_mode_matches(project_id) AND 
  EXISTS(SELECT 1 FROM public.projects p WHERE p.id = issue_resolutions.project_id AND p.customer_id = auth.uid())
);

-- foreman_notes
CREATE POLICY foreman_notes_test_isolation_select ON public.foreman_notes
FOR SELECT TO authenticated
USING (public.project_mode_matches(project_id) AND public.is_project_member(project_id));

CREATE POLICY foreman_notes_test_insert ON public.foreman_notes
FOR INSERT TO authenticated
WITH CHECK (
  public.project_mode_matches(project_id) AND 
  mandor_id = auth.uid() AND 
  public.is_project_mandor(project_id)
);

COMMENT ON POLICY project_mandors_test_manage ON public.project_mandors IS 
'Test isolation: supervisor can only assign mandors from same mode (test/non-test).';
