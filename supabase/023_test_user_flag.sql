-- Manual test-mode marker for profiles.
-- Existing users remain non-test by default. Auth user provisioning is handled
-- separately; do not place credentials or service-role secrets in SQL migrations.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test_user boolean NOT NULL DEFAULT false;

-- Keep profile edits limited to the existing user-editable fields. Revoke any
-- table-level UPDATE grant first because it would override column restrictions.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE (is_test_user) ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, address, avatar_url)
  ON TABLE public.profiles TO authenticated;

COMMENT ON COLUMN public.profiles.is_test_user IS
  'Manually provisioned test-mode marker. Must only be changed by trusted administrative tooling.';
