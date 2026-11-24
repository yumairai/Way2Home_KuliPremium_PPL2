-- Storage policies for test mode isolation
-- Update project-documents and contract-signatures to enforce mode boundaries

-- Drop existing project-documents policies
DROP POLICY IF EXISTS project_docs_storage_select ON storage.objects;
DROP POLICY IF EXISTS project_docs_storage_insert ON storage.objects;
DROP POLICY IF EXISTS project_docs_storage_delete ON storage.objects;

-- project-documents: test isolation enforced
CREATE POLICY project_docs_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner_profile ON owner_profile.id = p.customer_id
    WHERE (p.id)::text = (storage.foldername(name))[1]
      AND owner_profile.is_test_user = public.is_test_user()
      AND public.is_project_member(p.id)
  )
);

CREATE POLICY project_docs_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' 
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner_profile ON owner_profile.id = p.customer_id
    WHERE (p.id)::text = (storage.foldername(name))[1]
      AND owner_profile.is_test_user = public.is_test_user()
      AND p.customer_id = auth.uid()
  )
);

CREATE POLICY project_docs_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'project-documents' 
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner_profile ON owner_profile.id = p.customer_id
    WHERE (p.id)::text = (storage.foldername(name))[1]
      AND owner_profile.is_test_user = public.is_test_user()
      AND p.customer_id = auth.uid()
  )
);

-- Drop existing contract-signatures policies
DROP POLICY IF EXISTS contract_signatures_read_members ON storage.objects;
DROP POLICY IF EXISTS contract_signatures_insert_members ON storage.objects;

-- contract-signatures: test isolation enforced, no admin cross-mode access
CREATE POLICY contract_signatures_read_members ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contract-signatures' 
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner_profile ON owner_profile.id = p.customer_id
    WHERE (storage.foldername(name))[1] = (p.id)::text
      AND owner_profile.is_test_user = public.is_test_user()
      AND (p.customer_id = auth.uid() OR p.pengawas_id = auth.uid())
  )
);

CREATE POLICY contract_signatures_insert_members ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contract-signatures' 
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles owner_profile ON owner_profile.id = p.customer_id
    WHERE (storage.foldername(objects.name))[1] = (p.id)::text
      AND owner_profile.is_test_user = public.is_test_user()
      AND (
        (p.customer_id = auth.uid() 
         AND (storage.foldername(objects.name))[2] = (auth.uid())::text 
         AND storage.filename(objects.name) LIKE 'customer-%')
        OR
        (p.pengawas_id = auth.uid() 
         AND (storage.foldername(objects.name))[2] = (auth.uid())::text 
         AND storage.filename(objects.name) LIKE 'pengawas-%')
      )
  )
);

COMMENT ON POLICY project_docs_storage_select ON storage.objects IS 
'Test isolation: users can only access project documents from same-mode projects where they are members.';

COMMENT ON POLICY contract_signatures_read_members ON storage.objects IS 
'Test isolation: signatures only visible to customer/supervisor in same-mode projects. No admin cross-mode access.';
