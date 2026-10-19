-- Allow authenticated users to read pengawas profiles, subject to RLS policies.
GRANT SELECT ON public.pengawas_profiles TO authenticated;
