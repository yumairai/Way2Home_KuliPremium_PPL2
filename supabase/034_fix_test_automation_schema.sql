-- Correct test automation for the application's actual schema.
-- Projects/documents are the submission model; no submissions/payments tables are used.
-- Remove invalid RPCs/helpers introduced in 030/031 that reference nonexistent schema.
DROP FUNCTION IF EXISTS public.auto_verify_submission(uuid);
DROP FUNCTION IF EXISTS public.auto_approve_payment(uuid);
DROP FUNCTION IF EXISTS public.setup_test_customer_scenario(text);
DROP FUNCTION IF EXISTS public.create_dummy_test_project(uuid, text, numeric);

CREATE OR REPLACE FUNCTION public.test_automate_submission(
  p_project_id uuid,
  p_customer_id uuid,
  p_signature_path text,
  p_supervisor_id uuid,
  p_mandor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project public.projects%ROWTYPE;
  v_contract public.contracts%ROWTYPE;
BEGIN
  SELECT * INTO v_project
  FROM public.projects
  WHERE id = p_project_id AND customer_id = p_customer_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_customer_id AND is_test_user = true AND role = 'customer'
  ) THEN RAISE EXCEPTION 'Test customer required' USING ERRCODE = '42501'; END IF;

  IF v_project.status::text NOT IN ('verifikasi_dokumen','alokasi_mandor_pengawas','finalisasi_kontrak') THEN
    RETURN jsonb_build_object('success', true, 'already_advanced', true);
  END IF;

  IF EXISTS (
    SELECT required.kind FROM (VALUES ('sertifikat_tanah'),('ktp_pemilik'),('imb_pbg')) required(kind)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.project_documents d
      WHERE d.project_id = p_project_id AND d.jenis_dokumen = required.kind
    )
  ) THEN RAISE EXCEPTION 'Required documents missing' USING ERRCODE = '23514'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_supervisor_id AND is_test_user = true AND role = 'pengawas'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.mandor_profiles mp JOIN public.profiles p ON p.id = mp.id
    WHERE mp.id = p_mandor_id AND p.is_test_user = true AND p.role = 'mandor' AND mp.status::text = 'approved'
  ) THEN
    RAISE EXCEPTION 'Test staff not provisioned' USING ERRCODE = '23514';
  END IF;

  IF p_signature_path !~ ('^' || p_project_id::text || '/' || p_supervisor_id::text || '/pengawas-[a-f0-9-]+[.]png$') THEN
    RAISE EXCEPTION 'Invalid test signature path' USING ERRCODE = '22023';
  END IF;

  UPDATE public.project_documents
  SET review_status = 'approved', catatan = NULL
  WHERE project_id = p_project_id;

  INSERT INTO public.project_mandors(project_id, mandor_id, assigned_by)
  VALUES (p_project_id, p_mandor_id, p_supervisor_id)
  ON CONFLICT (project_id, mandor_id) DO NOTHING;

  IF v_project.status::text = 'verifikasi_dokumen' THEN
    UPDATE public.projects
    SET pengawas_id = p_supervisor_id, status = 'alokasi_mandor_pengawas'
    WHERE id = p_project_id;
  END IF;

  IF v_project.status::text IN ('verifikasi_dokumen','alokasi_mandor_pengawas') THEN
    UPDATE public.projects SET status = 'finalisasi_kontrak'
    WHERE id = p_project_id AND pengawas_id = p_supervisor_id;
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE project_id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract trigger did not create a contract' USING ERRCODE = 'P0001'; END IF;

  IF v_contract.signed_pengawas_signature_path IS NULL THEN
    UPDATE public.contracts
    SET status = 'menunggu_ttd',
        signed_pengawas_at = now(),
        signed_pengawas_signature_path = p_signature_path,
        company_signature_label = 'Placeholder tanda tangan PT Way2Home Konstruksi',
        document_version = greatest(document_version, 2)
    WHERE id = v_contract.id AND status = 'draft';
  END IF;

  RETURN jsonb_build_object('success', true, 'project_id', p_project_id, 'contract_id', v_contract.id);
END;
$$;

REVOKE ALL ON FUNCTION public.test_automate_submission(uuid, uuid, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_automate_submission(uuid, uuid, text, uuid, uuid) TO service_role;

GRANT ALL ON TABLE public.project_documents TO service_role;
GRANT ALL ON TABLE public.projects TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.mandor_profiles TO service_role;
GRANT ALL ON TABLE public.project_mandors TO service_role;
GRANT ALL ON TABLE public.contracts TO service_role;
