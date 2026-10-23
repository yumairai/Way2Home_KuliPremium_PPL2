-- Add payable due dates and idempotent payment schedule creation.
ALTER TABLE public.payment_stages
  ADD COLUMN IF NOT EXISTS tanggal_jatuh_tempo date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_project_urutan_unique
  ON public.payment_stages (project_id, urutan);

CREATE OR REPLACE FUNCTION public.create_project_payment_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_total numeric;
  dp_due_date date;
  installment_start_date date;
  dp_amount numeric;
  installment_one_amount numeric;
  installment_two_amount numeric;
  dp_paid boolean;
BEGIN
  IF NEW.status::text NOT IN ('pembayaran_dp', 'berjalan', 'selesai') THEN
    RETURN NEW;
  END IF;

  SELECT
    c.nilai_kontrak,
    (COALESCE(c.signed_customer_at, c.created_at)::date + 7),
    COALESCE(c.tanggal_mulai, NEW.created_at::date)
  INTO
    contract_total,
    dp_due_date,
    installment_start_date
  FROM public.contracts AS c
  WHERE c.project_id = NEW.id;

  IF NOT FOUND OR contract_total IS NULL OR contract_total <= 0 THEN
    RAISE EXCEPTION 'Kontrak dengan nilai valid wajib ada sebelum membuat jadwal pembayaran';
  END IF;

  contract_total := round(contract_total);
  dp_amount := round(contract_total * 0.30);
  installment_one_amount := round(contract_total * 0.25);
  installment_two_amount := round(contract_total * 0.25);
  dp_paid := NEW.status::text IN ('berjalan', 'selesai');

  INSERT INTO public.payment_stages (
    project_id,
    nama_tahap,
    urutan,
    nominal,
    status,
    tanggal_jatuh_tempo
  )
  VALUES
    (
      NEW.id,
      'Down Payment (30%)',
      0,
      dp_amount,
      CASE WHEN dp_paid THEN 'lunas'::public.payment_status ELSE 'belum'::public.payment_status END,
      dp_due_date
    ),
    (
      NEW.id,
      'Cicilan 1 (25%)',
      1,
      installment_one_amount,
      CASE WHEN NEW.status::text = 'selesai' THEN 'lunas'::public.payment_status ELSE 'belum'::public.payment_status END,
      (installment_start_date + INTERVAL '1 month')::date
    ),
    (
      NEW.id,
      'Cicilan 2 (25%)',
      2,
      installment_two_amount,
      CASE WHEN NEW.status::text = 'selesai' THEN 'lunas'::public.payment_status ELSE 'belum'::public.payment_status END,
      (installment_start_date + INTERVAL '2 months')::date
    ),
    (
      NEW.id,
      'Cicilan 3 (20%)',
      3,
      contract_total - dp_amount - installment_one_amount - installment_two_amount,
      CASE WHEN NEW.status::text = 'selesai' THEN 'lunas'::public.payment_status ELSE 'belum'::public.payment_status END,
      (installment_start_date + INTERVAL '3 months')::date
    )
  ON CONFLICT (project_id, urutan) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_project_payment_schedule_on_status_change
  ON public.projects;
CREATE TRIGGER create_project_payment_schedule_on_status_change
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_project_payment_schedule();

-- Backfill existing projects that already reached a payment stage.
WITH payment_projects AS (
  SELECT
    p.id AS project_id,
    p.status::text AS project_status,
    round(c.nilai_kontrak) AS total,
    COALESCE(c.tanggal_mulai, p.created_at::date) AS installment_start_date,
    COALESCE(c.signed_customer_at, c.created_at)::date + 7 AS dp_due_date
  FROM public.projects AS p
  JOIN public.contracts AS c ON c.project_id = p.id
  WHERE p.status::text IN ('pembayaran_dp', 'berjalan', 'selesai')
    AND c.nilai_kontrak > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.payment_stages AS existing
      WHERE existing.project_id = p.id
    )
),
amounts AS (
  SELECT
    *,
    round(total * 0.30) AS dp_amount,
    round(total * 0.25) AS installment_one_amount,
    round(total * 0.25) AS installment_two_amount
  FROM payment_projects
)
INSERT INTO public.payment_stages (
  project_id,
  nama_tahap,
  urutan,
  nominal,
  status,
  tanggal_jatuh_tempo
)
SELECT
  amounts.project_id,
  schedule.nama_tahap,
  schedule.urutan,
  schedule.nominal,
  schedule.status,
  schedule.tanggal_jatuh_tempo
FROM amounts
CROSS JOIN LATERAL (
  VALUES
    (
      'Down Payment (30%)',
      0,
      amounts.dp_amount,
      CASE
        WHEN amounts.project_status IN ('berjalan', 'selesai')
          THEN 'lunas'::public.payment_status
        ELSE 'belum'::public.payment_status
      END,
      amounts.dp_due_date
    ),
    (
      'Cicilan 1 (25%)',
      1,
      amounts.installment_one_amount,
      CASE
        WHEN amounts.project_status = 'selesai' THEN 'lunas'::public.payment_status
        ELSE 'belum'::public.payment_status
      END,
      (amounts.installment_start_date + INTERVAL '1 month')::date
    ),
    (
      'Cicilan 2 (25%)',
      2,
      amounts.installment_two_amount,
      CASE
        WHEN amounts.project_status = 'selesai' THEN 'lunas'::public.payment_status
        ELSE 'belum'::public.payment_status
      END,
      (amounts.installment_start_date + INTERVAL '2 months')::date
    ),
    (
      'Cicilan 3 (20%)',
      3,
      amounts.total - amounts.dp_amount - amounts.installment_one_amount - amounts.installment_two_amount,
      CASE
        WHEN amounts.project_status = 'selesai' THEN 'lunas'::public.payment_status
        ELSE 'belum'::public.payment_status
      END,
      (amounts.installment_start_date + INTERVAL '3 months')::date
    )
) AS schedule(nama_tahap, urutan, nominal, status, tanggal_jatuh_tempo)
ON CONFLICT (project_id, urutan) DO NOTHING;
