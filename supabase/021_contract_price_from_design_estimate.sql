-- Contract price must always come from the selected design's estimated cost.
-- Customer budget remains on projects.budget_proyek for supervisor risk review.

CREATE OR REPLACE FUNCTION public.enforce_design_estimate_contract_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  design_estimate numeric;
  contract_total numeric;
  dp_amount numeric;
  installment_one_amount numeric;
  installment_two_amount numeric;
BEGIN
  SELECT d.estimasi_biaya
    INTO design_estimate
  FROM public.projects AS p
  JOIN public.designs AS d ON d.id = p.design_id
  WHERE p.id = NEW.project_id;

  IF design_estimate IS NULL OR design_estimate <= 0 THEN
    RAISE EXCEPTION 'Estimasi biaya desain harus lebih dari nol sebelum kontrak diterbitkan';
  END IF;

  contract_total := round(design_estimate);
  dp_amount := round(contract_total * 0.30);
  installment_one_amount := round(contract_total * 0.25);
  installment_two_amount := round(contract_total * 0.25);

  NEW.nilai_kontrak := contract_total;
  NEW.spesifikasi := jsonb_set(
    COALESCE(NEW.spesifikasi, '{}'::jsonb),
    '{tahapan_pembayaran}',
    jsonb_build_array(
      jsonb_build_object(
        'urutan', 0,
        'nama', 'Down Payment (30%)',
        'nominal', dp_amount
      ),
      jsonb_build_object(
        'urutan', 1,
        'nama', 'Cicilan 1 (25%)',
        'nominal', installment_one_amount
      ),
      jsonb_build_object(
        'urutan', 2,
        'nama', 'Cicilan 2 (25%)',
        'nominal', installment_two_amount
      ),
      jsonb_build_object(
        'urutan', 3,
        'nama', 'Cicilan 3 (20%)',
        'nominal', contract_total - dp_amount - installment_one_amount - installment_two_amount
      )
    ),
    true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_design_estimate_contract_price
  ON public.contracts;
CREATE TRIGGER enforce_design_estimate_contract_price
  BEFORE INSERT OR UPDATE OF nilai_kontrak ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_design_estimate_contract_price();

-- Refresh contracts still awaiting customer signature. Signed contracts and
-- payment history remain unchanged.
UPDATE public.contracts AS c
SET nilai_kontrak = c.nilai_kontrak
FROM public.projects AS p
JOIN public.designs AS d ON d.id = p.design_id
WHERE p.id = c.project_id
  AND c.signed_customer_at IS NULL
  AND c.status::text IN ('draft', 'menunggu_ttd')
  AND c.nilai_kontrak IS DISTINCT FROM round(d.estimasi_biaya);
