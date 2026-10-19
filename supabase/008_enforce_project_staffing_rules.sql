-- Returns verified mandors not assigned to any active project.
-- This is used by the UI to display available options; it does not enforce writes.
CREATE OR REPLACE FUNCTION public.get_available_mandor_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mp.id
  FROM public.mandor_profiles mp
  WHERE public.get_my_role() = 'pengawas'
    AND mp.status = 'approved'
    AND NOT EXISTS (
      SELECT 1
      FROM public.project_mandors pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.mandor_id = mp.id
        AND p.status::text NOT IN ('selesai', 'batal')
    );
$$;

REVOKE ALL ON FUNCTION public.get_available_mandor_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_mandor_ids() TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.projects TO authenticated;
GRANT SELECT ON public.pengawas_profiles, public.mandor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_mandors TO authenticated;
