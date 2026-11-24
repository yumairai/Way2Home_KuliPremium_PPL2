-- RLS helpers for test mode isolation
-- Part 1: Helper functions created by test_user_rls_helpers migration

CREATE OR REPLACE FUNCTION public.is_test_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE((SELECT p.is_test_user FROM public.profiles p WHERE p.id = auth.uid()), false)
$$;

REVOKE ALL ON FUNCTION public.is_test_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_test_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.profile_mode_matches(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles target
    WHERE target.id = uid AND target.is_test_user = public.is_test_user()
  )
$$;

REVOKE ALL ON FUNCTION public.profile_mode_matches(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_mode_matches(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.project_mode_matches(pid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner_profile ON owner_profile.id = p.customer_id
    WHERE p.id = pid AND owner_profile.is_test_user = public.is_test_user()
  )
$$;

REVOKE ALL ON FUNCTION public.project_mode_matches(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.project_mode_matches(uuid) TO authenticated;

COMMENT ON FUNCTION public.is_test_user() IS 'Returns test mode status of current user. Used by RLS policies to enforce test/non-test isolation.';
COMMENT ON FUNCTION public.profile_mode_matches(uuid) IS 'Returns true if target profile matches current user test mode.';
COMMENT ON FUNCTION public.project_mode_matches(uuid) IS 'Returns true if project owner matches current user test mode.';
