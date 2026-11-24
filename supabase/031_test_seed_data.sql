-- Test user seed data and dummy project template
-- Note: Test user accounts must be created via Supabase Auth Dashboard/API
-- This migration only provides helper functions to create dummy test projects
-- Six test accounts already provisioned manually (see TASKS_EXTERNAL.md):
--   customer-testing-1@way2home.test (password: testing123)
--   customer-testing-2@way2home.test (password: testing123)
--   customer-testing-3@way2home.test (password: testing123)
--   pengawas-testing@way2home.test (password: testing123)
--   mandor-testing@way2home.test (password: testing123)
--   admin-testing@way2home.test (password: testing123)

-- Function to create dummy test project with 50% progress
CREATE OR REPLACE FUNCTION public.create_dummy_test_project(
  p_customer_id uuid,
  p_house_type text DEFAULT 'type_45',
  p_total_budget numeric DEFAULT 150000000
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_pengawas_id uuid;
  v_mandor_id uuid;
  v_contract_id uuid;
  v_stage_count int := 4;
  v_stage_id uuid;
  v_payment_stage_id uuid;
  i int;
BEGIN
  -- Get test pengawas and mandor
  SELECT id INTO v_pengawas_id FROM public.profiles 
  WHERE is_test_user = true AND role = 'pengawas' LIMIT 1;
  
  SELECT id INTO v_mandor_id FROM public.profiles 
  WHERE is_test_user = true AND role = 'mandor' LIMIT 1;
  
  IF v_pengawas_id IS NULL OR v_mandor_id IS NULL THEN
    RAISE EXCEPTION 'Test pengawas or mandor not found';
  END IF;
  
  -- Create project (mode inherited from customer_id)
  INSERT INTO public.projects (
    customer_id, pengawas_id, status, total_cost,
    start_date, estimated_end_date
  )
  VALUES (
    p_customer_id, v_pengawas_id, 'in_progress', p_total_budget,
    now() - interval '30 days', now() + interval '90 days'
  )
  RETURNING id INTO v_project_id;
  
  -- Assign mandor
  INSERT INTO public.project_mandors (project_id, mandor_id)
  VALUES (v_project_id, v_mandor_id);
  
  -- Create house design (from AI recommendation)
  INSERT INTO public.house_designs (
    project_id, design_type, land_area, building_area,
    num_bedrooms, num_bathrooms, num_floors,
    estimated_cost, ai_recommendation_data
  )
  VALUES (
    v_project_id, p_house_type, 100, 45,
    2, 1, 1,
    p_total_budget, '{"prompt": "Test house design", "features": ["carport", "living room", "kitchen"]}'::jsonb
  );
  
  -- Create submission (approved)
  INSERT INTO public.submissions (
    project_id, ktp_url, kk_url, additional_docs,
    verification_status, verified_by, verified_at, verification_notes
  )
  VALUES (
    v_project_id, 
    'test://ktp-dummy.jpg', 
    'test://kk-dummy.jpg',
    '[]'::jsonb,
    'approved', v_pengawas_id, now() - interval '25 days', 'Auto-verified test submission'
  );
  
  -- Create contract (all signed)
  INSERT INTO public.contracts (
    project_id, contract_url, 
    pengawas_signature_url, pengawas_signed_at,
    customer_signature_url, customer_signed_at
  )
  VALUES (
    v_project_id,
    'test://contract-dummy.pdf',
    'test://pengawas-signature.png', now() - interval '24 days',
    'test://customer-signature.png', now() - interval '23 days'
  )
  RETURNING id INTO v_contract_id;
  
  -- Create DP payment (completed)
  INSERT INTO public.payments (
    project_id, payment_type, amount, status,
    payment_proof_url, paid_at, verified_by, verified_at
  )
  VALUES (
    v_project_id, 'dp', p_total_budget * 0.3, 'completed',
    'test://dp-payment-proof.jpg', now() - interval '23 days',
    v_pengawas_id, now() - interval '23 days'
  );
  
  -- Create project stages (4 stages, 2 completed = 50%)
  FOR i IN 1..v_stage_count LOOP
    INSERT INTO public.project_stages (
      project_id, stage_number, stage_name, description,
      start_date, estimated_duration_days,
      status, progress_percentage, completed_at
    )
    VALUES (
      v_project_id, i,
      CASE i
        WHEN 1 THEN 'Persiapan Lahan'
        WHEN 2 THEN 'Pondasi'
        WHEN 3 THEN 'Struktur Bangunan'
        WHEN 4 THEN 'Finishing'
      END,
      'Test stage ' || i,
      now() - interval '20 days' + (i-1) * interval '10 days',
      10,
      CASE WHEN i <= 2 THEN 'completed' WHEN i = 3 THEN 'in_progress' ELSE 'pending' END,
      CASE WHEN i <= 2 THEN 100 WHEN i = 3 THEN 50 ELSE 0 END,
      CASE WHEN i <= 2 THEN now() - interval '20 days' + i * interval '10 days' ELSE NULL END
    )
    RETURNING id INTO v_stage_id;
    
    -- Add subtasks for each stage
    INSERT INTO public.project_stage_tasks (stage_id, task_name, status)
    VALUES 
      (v_stage_id, 'Subtask 1', CASE WHEN i <= 2 THEN 'completed' WHEN i = 3 THEN 'in_progress' ELSE 'pending' END),
      (v_stage_id, 'Subtask 2', CASE WHEN i <= 2 THEN 'completed' ELSE 'pending' END);
  END LOOP;
  
  -- Create payment stages
  INSERT INTO public.payment_stages (
    project_id, stage_number, stage_name, amount, status, paid_at
  )
  VALUES 
    (v_project_id, 1, 'DP', p_total_budget * 0.3, 'paid', now() - interval '23 days'),
    (v_project_id, 2, 'Termin 1', p_total_budget * 0.3, 'pending', NULL),
    (v_project_id, 3, 'Pelunasan', p_total_budget * 0.4, 'pending', NULL);
  
  -- Create project updates
  INSERT INTO public.project_updates (
    project_id, pengawas_id, update_type, description,
    photo_urls, progress_percentage
  )
  VALUES 
    (v_project_id, v_pengawas_id, 'progress', 'Pondasi selesai', '["test://photo1.jpg"]'::jsonb, 25),
    (v_project_id, v_pengawas_id, 'progress', 'Struktur bangunan 50%', '["test://photo2.jpg"]'::jsonb, 50);
  
  -- Create a dummy kendala that needs customer approval
  INSERT INTO public.kendala (
    project_id, reported_by, issue_type, description,
    severity, status, photo_urls
  )
  VALUES (
    v_project_id, v_mandor_id, 'material', 
    'Test kendala: perlu approval customer untuk perubahan material',
    'medium', 'reported',
    '["test://issue-photo.jpg"]'::jsonb
  );
  
  -- Create issue resolution (waiting customer decision)
  INSERT INTO public.issue_resolutions (
    project_id, kendala_id, proposed_solution,
    estimated_additional_cost, estimated_delay_days,
    requires_customer_approval, resolution_status
  )
  SELECT 
    v_project_id, k.id,
    'Gunakan material alternatif dengan spesifikasi setara',
    5000000, 3,
    true, 'pending_customer'
  FROM public.kendala k
  WHERE k.project_id = v_project_id
  LIMIT 1;
  
  -- Create foreman notes
  INSERT INTO public.foreman_notes (
    project_id, mandor_id, note_type, content, photo_urls
  )
  VALUES 
    (v_project_id, v_mandor_id, 'daily_report', 'Pekerjaan pondasi berjalan lancar', '["test://workday1.jpg"]'::jsonb),
    (v_project_id, v_mandor_id, 'daily_report', 'Struktur bangunan dimulai', '["test://workday2.jpg"]'::jsonb);
  
  RETURN v_project_id;
END;
$$;

-- Function to setup complete test scenario for a customer
CREATE OR REPLACE FUNCTION public.setup_test_customer_scenario(p_customer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_project_id uuid;
BEGIN
  -- Get customer ID
  SELECT id INTO v_customer_id FROM public.profiles 
  WHERE email = p_customer_email AND is_test_user = true;
  
  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Test customer not found: ' || p_customer_email);
  END IF;
  
  -- Create dummy project with 50% progress and pending issue
  v_project_id := public.create_dummy_test_project(v_customer_id, 'type_45', 150000000);
  
  RETURN jsonb_build_object(
    'success', true, 
    'customer_id', v_customer_id,
    'project_id', v_project_id,
    'message', 'Test scenario created successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.create_dummy_test_project IS 'Creates a dummy test project with 50% progress, pending issue requiring customer approval.';
COMMENT ON FUNCTION public.setup_test_customer_scenario IS 'Complete test scenario setup for a test customer account.';

-- Note: Actual auth.users records must be created via Supabase Auth API
-- Run this after migration:
-- SELECT public.setup_test_customer_scenario('customer-testing-1@way2home.test');
