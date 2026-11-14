-- Allow a customer to read the profiles of the team assigned to their project.
-- This is required for the customer tracking page to display real names and
-- phone numbers from profiles instead of placeholders.

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_my_role() = 'admin'
    OR get_my_role() IN ('pengawas', 'mandor')
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.customer_id = auth.uid()
        AND (
          p.pengawas_id = profiles.id
          OR EXISTS (
            SELECT 1
            FROM public.project_mandors pm
            WHERE pm.project_id = p.id
              AND pm.mandor_id = profiles.id
          )
        )
    )
  );
