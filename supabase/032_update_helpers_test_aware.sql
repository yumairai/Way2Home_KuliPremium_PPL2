-- Update existing helper functions to be test-mode aware
-- Ensures all policies using these helpers automatically enforce test isolation

-- Update get_my_role: no changes needed, only reads caller's own profile
-- (Already safe)

-- Update is_project_member: add mode check
CREATE OR REPLACE FUNCTION public.is_project_member(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE p.id = pid
      AND owner.is_test_user = public.is_test_user()  -- Mode isolation
      AND (
        p.customer_id = auth.uid()
        OR p.pengawas_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_mandors pm 
          WHERE pm.project_id = p.id AND pm.mandor_id = auth.uid()
        )
        OR public.get_my_role() = 'admin'
      )
  )
$$;

-- Update is_project_pengawas: add mode check
CREATE OR REPLACE FUNCTION public.is_project_pengawas(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE p.id = pid 
      AND owner.is_test_user = public.is_test_user()  -- Mode isolation
      AND p.pengawas_id = auth.uid()
  )
$$;

-- Update is_project_mandor: add mode check
CREATE OR REPLACE FUNCTION public.is_project_mandor(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_mandors pm
    JOIN public.projects p ON p.id = pm.project_id
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE pm.project_id = pid
      AND owner.is_test_user = public.is_test_user()  -- Mode isolation
      AND pm.mandor_id = auth.uid()
  )
$$;

COMMENT ON FUNCTION public.is_project_member(uuid) IS 'Test-aware: returns true only if caller is project member AND project mode matches caller mode.';
COMMENT ON FUNCTION public.is_project_pengawas(uuid) IS 'Test-aware: returns true only if caller is project pengawas AND project mode matches caller mode.';
COMMENT ON FUNCTION public.is_project_mandor(uuid) IS 'Test-aware: returns true only if caller is project mandor AND project mode matches caller mode.';
