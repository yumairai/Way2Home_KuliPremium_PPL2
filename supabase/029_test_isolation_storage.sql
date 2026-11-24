-- Storage policies with test mode isolation
-- documents bucket: project documents, house designs, contracts

-- Clean up existing policies
DROP POLICY IF EXISTS "documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "documents_read" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete" ON storage.objects;

-- Upload: same-mode user, path starts with their project
CREATE POLICY "documents_upload_test_isolation" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT p.id FROM public.projects p
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE owner.is_test_user = public.is_test_user()
      AND (p.customer_id = auth.uid() OR public.is_project_member(p.id))
  )
);

-- Read: same-mode project member can read
CREATE POLICY "documents_read_test_isolation" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT p.id FROM public.projects p
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE owner.is_test_user = public.is_test_user()
      AND public.is_project_member(p.id)
  )
);

-- Delete: uploader or pengawas, same-mode
CREATE POLICY "documents_delete_test_isolation" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    owner = auth.uid() OR
    (storage.foldername(name))[1]::uuid IN (
      SELECT p.id FROM public.projects p
      JOIN public.profiles owner_profile ON owner_profile.id = p.customer_id
      WHERE owner_profile.is_test_user = public.is_test_user()
        AND public.is_project_pengawas(p.id)
    )
  )
);

COMMENT ON POLICY "documents_upload_test_isolation" ON storage.objects IS 'Test isolation: upload to same-mode projects only.';
COMMENT ON POLICY "documents_read_test_isolation" ON storage.objects IS 'Test isolation: read from same-mode projects only.';
COMMENT ON POLICY "documents_delete_test_isolation" ON storage.objects IS 'Test isolation: delete from same-mode projects only.';
