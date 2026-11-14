CREATE OR REPLACE FUNCTION public.customer_sign_contract(pid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_row public.contracts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Anda harus login terlebih dahulu.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.projects AS p
    WHERE p.id = pid
      AND p.customer_id = auth.uid()
      AND p.status = 'finalisasi_kontrak'
  ) THEN
    RAISE EXCEPTION 'Proyek tidak ditemukan atau belum berada pada tahap finalisasi kontrak.';
  END IF;

  SELECT *
  INTO contract_row
  FROM public.contracts AS c
  WHERE c.project_id = pid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kontrak proyek tidak ditemukan.';
  END IF;

  IF contract_row.signed_customer_at IS NOT NULL
    OR contract_row.status IN ('aktif', 'selesai') THEN
    RAISE EXCEPTION 'Kontrak sudah disetujui sebelumnya.';
  END IF;

  IF contract_row.status NOT IN ('draft', 'menunggu_ttd') THEN
    RAISE EXCEPTION 'Kontrak belum dapat ditandatangani.';
  END IF;

  UPDATE public.contracts
  SET status = 'aktif',
      signed_customer_at = now()
  WHERE id = contract_row.id;

  UPDATE public.projects
  SET status = 'pembayaran_dp'
  WHERE id = pid
    AND customer_id = auth.uid()
    AND status = 'finalisasi_kontrak';
END;
$$;

REVOKE ALL ON FUNCTION public.customer_sign_contract(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_sign_contract(uuid) TO authenticated;