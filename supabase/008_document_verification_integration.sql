ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected'));

GRANT UPDATE ON public.projects TO authenticated;
GRANT UPDATE ON public.project_documents TO authenticated;
