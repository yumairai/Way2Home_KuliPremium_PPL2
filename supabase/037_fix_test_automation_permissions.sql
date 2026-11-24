-- Reapply test automation table privileges on databases where migration 034
-- was applied before explicit service-role grants were added.

GRANT ALL ON TABLE public.project_documents TO service_role;
GRANT ALL ON TABLE public.projects TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.mandor_profiles TO service_role;
GRANT ALL ON TABLE public.project_mandors TO service_role;
GRANT ALL ON TABLE public.contracts TO service_role;
GRANT ALL ON TABLE public.payment_stages TO service_role;
GRANT ALL ON TABLE public.project_stages TO service_role;
GRANT ALL ON TABLE public.project_subtasks TO service_role;
GRANT ALL ON TABLE public.progress_reports TO service_role;
GRANT ALL ON TABLE public.progress_documentation TO service_role;
GRANT ALL ON TABLE public.kendala TO service_role;
GRANT ALL ON TABLE public.issue_resolutions TO service_role;
