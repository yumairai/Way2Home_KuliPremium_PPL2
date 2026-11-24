-- RLS policies for test mode isolation - Customer data and notifications
-- customer_requirements, ai_recommendations, notifications

-- Drop existing policies
DO $$ 
DECLARE 
  t text;
  pol record;
BEGIN
  FOR t IN SELECT unnest(ARRAY['customer_requirements','ai_recommendations','notifications']) 
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies 
      WHERE schemaname='public' AND tablename=t 
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- customer_requirements (AI recommendation input)
CREATE POLICY requirements_test_owner ON public.customer_requirements
FOR ALL TO authenticated
USING (
  customer_id = auth.uid() AND 
  EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = customer_id AND p.is_test_user = public.is_test_user())
)
WITH CHECK (
  customer_id = auth.uid() AND 
  EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = customer_id AND p.is_test_user = public.is_test_user())
);

-- ai_recommendations (AI recommendation output)
CREATE POLICY recommendations_test_select ON public.ai_recommendations
FOR SELECT TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.customer_requirements r 
    JOIN public.profiles p ON p.id = r.customer_id 
    WHERE r.id = requirement_id 
      AND r.customer_id = auth.uid() 
      AND p.is_test_user = public.is_test_user()
  )
);

-- notifications
CREATE POLICY notifications_test_select ON public.notifications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  AND public.profile_mode_matches(user_id) 
  AND (project_id IS NULL OR public.project_mode_matches(project_id))
);

CREATE POLICY notifications_test_update ON public.notifications
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() 
  AND public.profile_mode_matches(user_id) 
  AND (project_id IS NULL OR public.project_mode_matches(project_id))
)
WITH CHECK (
  user_id = auth.uid() 
  AND public.profile_mode_matches(user_id) 
  AND (project_id IS NULL OR public.project_mode_matches(project_id))
);

COMMENT ON POLICY notifications_test_select ON public.notifications IS 
'Test isolation: users only see notifications for their mode and projects they can access.';
