-- Fix projects INSERT policy: allow customer to insert their own projects
-- Mode check happens on SELECT via project_mode_matches()
DROP POLICY IF EXISTS projects_customer_insert ON public.projects;

CREATE POLICY projects_customer_insert ON public.projects
FOR INSERT TO authenticated
WITH CHECK (
  customer_id = auth.uid()
);

COMMENT ON POLICY projects_customer_insert ON public.projects IS 
'Allow customers to create projects. Mode isolation enforced on SELECT via project_mode_matches().';
