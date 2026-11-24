-- Revoke anon access from SECURITY DEFINER RPC functions
-- Security hardening: prevent unauthenticated calls to privileged functions

DO $$
DECLARE
  func record;
BEGIN
  -- Revoke EXECUTE from anon and public on all SECURITY DEFINER functions in public schema
  FOR func IN 
    SELECT p.oid::regprocedure::text as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true  -- SECURITY DEFINER
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, public', func.func_signature);
  END LOOP;
  
  -- Grant EXECUTE to authenticated for helpers and business logic RPC
  -- (test automation RPC already restricted to service_role only)
  GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
  GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.is_project_pengawas(uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.is_project_mandor(uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.is_test_user() TO authenticated;
  GRANT EXECUTE ON FUNCTION public.profile_mode_matches(uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.project_mode_matches(uuid) TO authenticated;
  
  -- Business logic RPC: only authenticated with proper RLS checks inside
  -- Grant only to functions that exist (verified via schema inspection)
  IF EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.approve_progress_report(uuid,text)'::regprocedure) THEN
    GRANT EXECUTE ON FUNCTION public.approve_progress_report(uuid, text) TO authenticated;
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.reject_progress_report(uuid,text)'::regprocedure) THEN
    GRANT EXECUTE ON FUNCTION public.reject_progress_report(uuid, text) TO authenticated;
  END IF;
  
  IF EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.apply_verified_progress()'::regprocedure) THEN
    GRANT EXECUTE ON FUNCTION public.apply_verified_progress() TO authenticated;
  END IF;
END $$;

COMMENT ON FUNCTION public.is_test_user() IS 
'RLS helper: returns test mode of current user. Only callable by authenticated users.';

-- Verify no anon access remains on SECURITY DEFINER functions
DO $$
DECLARE
  violation record;
BEGIN
  FOR violation IN
    SELECT p.oid::regprocedure::text as func_name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    RAISE WARNING 'SECURITY: anon still has EXECUTE on %', violation.func_name;
  END LOOP;
END $$;
