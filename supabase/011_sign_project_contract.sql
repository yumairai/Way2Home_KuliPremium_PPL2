CREATE OR REPLACE FUNCTION public.sign_project_contract(pid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status public.project_status;
  current_contract_status public.contract_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Anda harus login terlebih dahulu'
      USING ERRCODE = '42501';
  END IF;

  SELECT status
  INTO current_status
  FROM public.projects
  WHERE id = pid
    AND customer_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyek tidak ditemukan'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_status <> 'finalisasi_kontrak' THEN
    RAISE EXCEPTION 'Proyek tidak sedang menunggu finalisasi kontrak'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT status
  INTO current_contract_status
  FROM public.contracts
  WHERE project_id = pid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data kontrak proyek belum dibuat'
      USING ERRCODE = 'P0001';
  END IF;

  IF current_contract_status::text NOT IN (
    'draft',
    'menunggu_ttd',
    'sent',
    'aktif'
  ) THEN
    RAISE EXCEPTION 'Kontrak tidak tersedia untuk ditandatangani'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.contracts
  SET status = 'aktif',
      signed_customer_at = COALESCE(signed_customer_at, now())
  WHERE project_id = pid;

  UPDATE public.projects
  SET status = 'pembayaran_dp'
  WHERE id = pid;
END;
$$;

REVOKE ALL ON FUNCTION public.sign_project_contract(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sign_project_contract(uuid) TO authenticated;
