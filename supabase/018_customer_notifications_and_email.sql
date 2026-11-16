-- ============================================================
-- 018_customer_notifications_and_email.sql
--
-- Menyiapkan tabel notifications untuk seluruh alur notifikasi customer:
-- 1. Verifikasi dokumen selesai
-- 2. Alokasi pengawas & mandor selesai
-- 3. Kontrak siap ditandatangani
-- 4. Pengingat deadline ttd kontrak (H-3)
-- 5. Tagihan Down Payment (DP) siap dibayar
-- 6. Pengingat deadline DP (H-3)
-- 7. Pengingat deadline cicilan 1, 2, 3 (H-30, H-7, H-3)
-- 8. Laporan progres mandor disetujui pengawas
-- 9. Proyek selesai
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  judul text NOT NULL,
  isi text,
  tipe text,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tambah kolom jika tabel sudah ada dari skema awal
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tipe text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Grant permissions ke service_role dan authenticated
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;

-- Grant permissions ke service_role untuk tabel terkait notifikasi
GRANT SELECT ON public.designs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mandor_profiles TO service_role;
GRANT SELECT ON public.payment_stages TO service_role;

-- Indexing
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_project_tipe
  ON public.notifications(project_id, tipe);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_service_role" ON public.notifications;
CREATE POLICY "notifications_service_role" ON public.notifications
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
