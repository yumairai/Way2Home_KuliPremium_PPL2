-- RLS policies for test mode isolation - Profiles
-- Replaces admin-all and broad team-select with mode-aware policies

DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

-- Profile visibility: own profile or same-mode profiles in shared projects
CREATE POLICY profiles_select ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() OR public.profile_mode_matches(id)
);

-- Profile updates: own profile only, with mode check
CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() AND public.profile_mode_matches(id))
WITH CHECK (id = auth.uid() AND public.profile_mode_matches(id) AND role = public.get_my_role());

COMMENT ON POLICY profiles_select ON public.profiles IS 'Test isolation: users can only see profiles in their mode (test/non-test).';
