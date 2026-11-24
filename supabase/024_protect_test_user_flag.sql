-- Prevent authenticated clients from setting test mode during direct profile INSERT.
-- Provisioning must use trusted administrative tooling (service_role/postgres).
-- Revoke table-level INSERT too: column-level revokes cannot override it.
REVOKE INSERT ON TABLE public.profiles FROM authenticated;
REVOKE INSERT (is_test_user) ON TABLE public.profiles FROM authenticated;
