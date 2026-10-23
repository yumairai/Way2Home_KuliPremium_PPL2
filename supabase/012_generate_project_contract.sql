CREATE OR REPLACE FUNCTION public.generate_project_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_design public.designs%ROWTYPE;
  project_customer public.profiles%ROWTYPE;
  project_supervisor public.profiles%ROWTYPE;
  project_value numeric;
  project_scope text;
  project_specification jsonb;
  project_mandors jsonb;
  dp_amount numeric;
  installment_one_amount numeric;
  installment_two_amount numeric;
BEGIN
  IF NEW.status::text <> 'finalisasi_kontrak' THEN
    RETURN NEW;
  END IF;

  IF NEW.pengawas_id IS NULL THEN
    RAISE EXCEPTION 'Pengawas harus dialokasikan sebelum kontrak diterbitkan';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.project_mandors
    WHERE project_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Minimal satu mandor harus dialokasikan sebelum kontrak diterbitkan';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.contracts WHERE project_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO project_design
  FROM public.designs
  WHERE id = NEW.design_id;

  SELECT * INTO project_customer
  FROM public.profiles
  WHERE id = NEW.customer_id;

  SELECT * INTO project_supervisor
  FROM public.profiles
  WHERE id = NEW.pengawas_id;

  IF project_design.id IS NULL OR project_customer.id IS NULL
    OR project_supervisor.id IS NULL THEN
    RAISE EXCEPTION 'Data desain, customer, atau pengawas untuk kontrak tidak lengkap';
  END IF;

  project_value := COALESCE(
    NULLIF(NEW.nilai_proyek, 0),
    NULLIF(NEW.budget_proyek, 0),
    project_design.estimasi_biaya
  );

  IF project_value IS NULL OR project_value <= 0 THEN
    RAISE EXCEPTION 'Nilai proyek harus lebih dari nol sebelum kontrak diterbitkan';
  END IF;
  project_value := round(project_value);
  dp_amount := round(project_value * 0.30);
  installment_one_amount := round(project_value * 0.25);
  installment_two_amount := round(project_value * 0.25);

  project_scope := COALESCE(
    NULLIF(array_to_string(project_design.highlights, E'\n'), ''),
    NULLIF(project_design.deskripsi, ''),
    'Pekerjaan pembangunan rumah sesuai desain dan spesifikasi proyek yang disetujui.'
  );

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pm.mandor_id,
        'nama', mandor_profile.full_name,
        'telepon', mandor_profile.phone,
        'keahlian', mp.keahlian
      )
      ORDER BY pm.assigned_at
    ),
    '[]'::jsonb
  )
  INTO project_mandors
  FROM public.project_mandors AS pm
  JOIN public.mandor_profiles AS mp ON mp.id = pm.mandor_id
  JOIN public.profiles AS mandor_profile ON mandor_profile.id = mp.id
  WHERE pm.project_id = NEW.id;

  project_specification := jsonb_build_object(
    'desain', jsonb_build_object(
      'id', project_design.id,
      'nama', project_design.nama,
      'gaya_arsitektur', project_design.gaya_arsitektur,
      'luas_tanah', project_design.luas_tanah,
      'luas_bangunan', project_design.luas_bangunan,
      'jumlah_lantai', project_design.jumlah_lantai,
      'jumlah_kamar_tidur', project_design.jumlah_kamar_tidur,
      'jumlah_kamar_mandi', project_design.jumlah_kamar_mandi,
      'spesifikasi', project_design.spesifikasi
    ),
    'customer', jsonb_build_object(
      'id', project_customer.id,
      'nama', project_customer.full_name,
      'telepon', project_customer.phone
    ),
    'alamat_proyek', NEW.alamat_proyek,
    'tahapan_pembayaran', jsonb_build_array(
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
        'nominal',
        project_value - dp_amount - installment_one_amount - installment_two_amount
      )
    ),
    'mandor', project_mandors,
    'pengawas', jsonb_build_object(
      'id', project_supervisor.id,
      'nama', project_supervisor.full_name,
      'telepon', project_supervisor.phone
    )
  );

  INSERT INTO public.contracts (
    project_id,
    ruang_lingkup,
    spesifikasi,
    nilai_kontrak,
    tanggal_selesai_estimasi,
    status
  )
  VALUES (
    NEW.id,
    project_scope,
    project_specification,
    project_value,
    CURRENT_DATE + project_design.estimasi_durasi_hari,
    'draft'
  )
  ON CONFLICT (project_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_project_contract_on_finalization
  ON public.projects;
CREATE TRIGGER generate_project_contract_on_finalization
  BEFORE UPDATE OF status ON public.projects
  FOR EACH ROW
  WHEN (
    OLD.status::text = 'alokasi_mandor_pengawas'
    AND NEW.status::text = 'finalisasi_kontrak'
  )
  EXECUTE FUNCTION public.generate_project_contract();

-- Create contracts for projects that reached contract finalization before this
-- migration was applied. The same function validates staffing and snapshots the
-- current design and assigned team.
DO $$
DECLARE
  project_id uuid;
BEGIN
  FOR project_id IN
    SELECT p.id
    FROM public.projects AS p
    WHERE p.status::text = 'finalisasi_kontrak'
      AND NOT EXISTS (
        SELECT 1 FROM public.contracts AS c WHERE c.project_id = p.id
      )
      AND p.pengawas_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.project_mandors AS pm WHERE pm.project_id = p.id
      )
  LOOP
    UPDATE public.projects
    SET status = 'alokasi_mandor_pengawas'
    WHERE id = project_id;

    UPDATE public.projects
    SET status = 'finalisasi_kontrak'
    WHERE id = project_id;
  END LOOP;
END;
$$;
