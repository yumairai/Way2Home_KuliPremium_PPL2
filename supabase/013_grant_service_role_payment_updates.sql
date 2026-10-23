-- Allow server-side payment verification and Midtrans notifications to update
-- payment stages and advance projects after a verified successful payment.
GRANT SELECT, UPDATE ON TABLE public.payment_stages TO service_role;
GRANT SELECT, UPDATE ON TABLE public.projects TO service_role;
