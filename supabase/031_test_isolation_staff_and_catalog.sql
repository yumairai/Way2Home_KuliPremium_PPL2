-- RLS policies for test mode isolation - Staff profiles and designs catalog
-- pengawas_profiles, mandor_profiles, designs, design_images, design_location_scores

-- Drop existing policies
DO $$ 
DECLARE 
  t text;
  pol record;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pengawas_profiles','mandor_profiles','designs','design_images','design_location_scores'
  ]) 
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename=t 
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- pengawas_profiles (supervisor extended data)
CREATE POLICY pengawas_profiles_test_select ON public.pengawas_profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR public.profile_mode_matches(id)
);

CREATE POLICY pengawas_profiles_test_own_update ON public.pengawas_profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() AND public.profile_mode_matches(id))
WITH CHECK (id = auth.uid() AND public.profile_mode_matches(id));

-- mandor_profiles (foreman extended data)
CREATE POLICY mandor_profiles_test_select ON public.mandor_profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR public.profile_mode_matches(id)
);

CREATE POLICY mandor_profiles_test_own_update ON public.mandor_profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() AND public.profile_mode_matches(id))
WITH CHECK (id = auth.uid() AND public.profile_mode_matches(id));

-- designs (catalog - no mode restriction, all users see same designs)
CREATE POLICY designs_select_all ON public.designs
FOR SELECT TO authenticated
USING (true);

-- design_images (catalog - no mode restriction)
CREATE POLICY design_images_select_all ON public.design_images
FOR SELECT TO authenticated
USING (true);

-- design_location_scores (catalog - no mode restriction)
CREATE POLICY design_location_scores_select_all ON public.design_location_scores
FOR SELECT TO authenticated
USING (true);

COMMENT ON POLICY pengawas_profiles_test_select ON public.pengawas_profiles IS 
'Test isolation: users only see supervisor profiles in their mode.';

COMMENT ON POLICY designs_select_all ON public.designs IS 
'No test isolation: design catalog is shared across test and production modes.';
