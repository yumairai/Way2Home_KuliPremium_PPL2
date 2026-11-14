ALTER TABLE public.mandor_profiles
  ADD COLUMN IF NOT EXISTS ringkasan_pengalaman text,
  ADD COLUMN IF NOT EXISTS proyek_sebelumnya text,
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS catatan_verifikasi text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  CREATE TYPE public.mandor_keahlian_utama AS ENUM (
    'Pembangunan rumah',
    'Struktur dan pondasi',
    'Finishing',
    'Instalasi listrik',
    'Plumbing',
    'Lainnya'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.mandor_profiles
  DROP CONSTRAINT IF EXISTS mandor_profiles_keahlian_utama_check;

ALTER TABLE public.mandor_profiles
  ADD CONSTRAINT mandor_profiles_keahlian_utama_check
  CHECK (
    cardinality(keahlian) = 0
    OR (
      keahlian[1] IS NOT NULL
      AND keahlian[1]::public.mandor_keahlian_utama IS NOT NULL
    )
  ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_mandor_profiles_pending
  ON public.mandor_profiles(created_at DESC)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
BEGIN
  assigned_role := coalesce((new.raw_app_meta_data->>'role')::user_role, 'customer');

  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    new.id,
    assigned_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  );

  IF assigned_role = 'mandor' THEN
    INSERT INTO public.mandor_profiles (
      id,
      keahlian,
      pengalaman_tahun,
      area_kerja,
      ringkasan_pengalaman,
      proyek_sebelumnya
    )
    VALUES (
      new.id,
      ARRAY(
        SELECT jsonb_array_elements_text(
          coalesce(new.raw_user_meta_data->'keahlian', '[]'::jsonb)
        )
      ),
      nullif(new.raw_user_meta_data->>'pengalaman_tahun', '')::integer,
      new.raw_user_meta_data->>'area_kerja',
      new.raw_user_meta_data->>'ringkasan_pengalaman',
      new.raw_user_meta_data->>'proyek_sebelumnya'
    );
  ELSIF assigned_role = 'pengawas' THEN
    INSERT INTO public.pengawas_profiles (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$;

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = public.get_my_role());

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, address, avatar_url)
  ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "mandor_update_own" ON public.mandor_profiles;
CREATE POLICY "mandor_update_own" ON public.mandor_profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() AND public.get_my_role() = 'mandor' AND status = 'pending')
WITH CHECK (
  id = auth.uid()
  AND public.get_my_role() = 'mandor'
  AND status = 'pending'
  AND catatan_verifikasi IS NULL
  AND verified_at IS NULL
  AND verified_by IS NULL
);

DROP POLICY IF EXISTS "mandor_insert_own" ON public.mandor_profiles;
CREATE POLICY "mandor_insert_own" ON public.mandor_profiles
FOR INSERT TO authenticated
WITH CHECK (
  id = auth.uid()
  AND public.get_my_role() = 'mandor'
  AND status = 'pending'
);

REVOKE UPDATE ON public.mandor_profiles FROM authenticated;
GRANT UPDATE (
  keahlian,
  pengalaman_tahun,
  area_kerja,
  portofolio_url,
  ringkasan_pengalaman,
  proyek_sebelumnya,
  status,
  catatan_verifikasi,
  verified_at,
  verified_by
) ON public.mandor_profiles TO authenticated;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'mandor-cvs',
  'mandor-cvs',
  false,
  5242880,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "mandor_cvs_select_owner_or_admin" ON storage.objects;
CREATE POLICY "mandor_cvs_select_owner_or_admin" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'mandor-cvs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.get_my_role() = 'admin'
  )
);

GRANT ALL ON public.mandor_profiles TO service_role;
GRANT ALL ON public.mandor_profiles TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.mandor_profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO postgres;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
