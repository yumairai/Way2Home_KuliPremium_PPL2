-- Create these users first in Supabase Dashboard > Authentication > Users.
-- Set a password for each user and confirm the email during creation.
-- Replace the example emails below if you use different account emails.

DO $$
DECLARE
  missing_emails text;
BEGIN
  SELECT string_agg(account.email, ', ')
  INTO missing_emails
  FROM (VALUES
    ('admin-db@way2home.test'),
    ('mandor-db@way2home.test'),
    ('pengawas-db@way2home.test')
  ) AS account(email)
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.users AS auth_user
    WHERE lower(auth_user.email) = lower(account.email)
  );

  IF missing_emails IS NOT NULL THEN
    RAISE EXCEPTION 'Create these users in Supabase Auth before running this seed: %', missing_emails;
  END IF;
END;
$$;

INSERT INTO public.profiles (id, role, full_name, phone)
SELECT
  auth_user.id,
  account.role::public.user_role,
  account.full_name,
  NULL
FROM (VALUES
  ('admin-db@way2home.test', 'admin', 'Admin Way2Home'),
  ('mandor-db@way2home.test', 'mandor', 'Mandor Way2Home'),
  ('pengawas-db@way2home.test', 'pengawas', 'Pengawas Way2Home')
) AS account(email, role, full_name)
JOIN auth.users AS auth_user
  ON lower(auth_user.email) = lower(account.email)
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

INSERT INTO public.mandor_profiles (id)
SELECT auth_user.id
FROM auth.users AS auth_user
WHERE lower(auth_user.email) = lower('mandor-db@way2home.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pengawas_profiles (id, spesialisasi, aktif)
SELECT auth_user.id, 'Umum', true
FROM auth.users AS auth_user
WHERE lower(auth_user.email) = lower('pengawas-db@way2home.test')
ON CONFLICT (id) DO NOTHING;