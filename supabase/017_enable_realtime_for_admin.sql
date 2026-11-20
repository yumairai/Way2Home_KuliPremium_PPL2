-- ============================================================
-- 017: Enable Realtime for Admin Badge Notifications
-- ============================================================
-- Enable realtime untuk projects table agar admin dapat
-- menerima notifikasi badge count secara real-time

-- Enable realtime publication untuk table projects
-- Gunakan IF NOT EXISTS pattern dengan exception handling
DO $$
BEGIN
  -- Add projects table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    RAISE NOTICE 'Added projects to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'projects already in realtime publication, skipping';
  END;

  -- Add mandor_profiles table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE mandor_profiles;
    RAISE NOTICE 'Added mandor_profiles to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'mandor_profiles already in realtime publication, skipping';
  END;

  -- Add project_documents table to realtime publication (optional)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_documents;
    RAISE NOTICE 'Added project_documents to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'project_documents already in realtime publication, skipping';
  END;
END $$;

-- Verify what tables are in the realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================================
-- Note: Setelah migration ini, perlu restart Supabase Realtime
-- di dashboard atau tunggu beberapa detik untuk apply changes
-- ============================================================
