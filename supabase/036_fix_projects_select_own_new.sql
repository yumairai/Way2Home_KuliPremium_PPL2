-- Allow user to SELECT their own newly inserted project
-- Existing SELECT policy checks project_mode_matches which needs committed customer profile
-- Add policy for immediate SELECT after INSERT
DROP POLICY IF EXISTS projects_select ON public.projects;

-- Main SELECT policy: mode-aware visibility
CREATE POLICY projects_select ON public.projects
FOR SELECT TO authenticated
USING (
  public.project_mode_matches(id) AND 
  (customer_id = auth.uid() OR pengawas_id = auth.uid() OR public.is_project_mandor(id))
);

-- Additional SELECT policy for newly inserted rows (before mode check can run)
CREATE POLICY projects_select_own_immediate ON public.projects
FOR SELECT TO authenticated
USING (customer_id = auth.uid());

COMMENT ON POLICY projects_select ON public.projects IS 
'Mode-aware project visibility: users see projects where owner mode matches.';

COMMENT ON POLICY projects_select_own_immediate ON public.projects IS
'Allow immediate SELECT of own projects after INSERT, before mode isolation applies.';
