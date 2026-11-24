-- RPC functions with test mode isolation and auto-approval

-- Drop existing functions
DROP FUNCTION IF EXISTS public.auto_verify_submission(uuid);
DROP FUNCTION IF EXISTS public.auto_approve_payment(uuid);
DROP FUNCTION IF EXISTS public.get_my_projects();
DROP FUNCTION IF EXISTS public.get_project_members(uuid);

-- Auto-verify submission (test mode only)
CREATE OR REPLACE FUNCTION public.auto_verify_submission(submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_is_test boolean;
  v_user_is_test boolean;
BEGIN
  -- Check if user is test user
  SELECT public.is_test_user() INTO v_user_is_test;
  
  -- Get submission project and test status
  SELECT s.project_id, owner.is_test_user 
  INTO v_project_id, v_is_test
  FROM public.submissions s
  JOIN public.projects p ON p.id = s.project_id
  JOIN public.profiles owner ON owner.id = p.customer_id
  WHERE s.id = submission_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission not found');
  END IF;
  
  -- Only allow in test mode with same-mode user
  IF NOT v_is_test OR NOT v_user_is_test THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auto-verify only available in test mode');
  END IF;
  
  -- Auto-verify submission
  UPDATE public.submissions
  SET 
    verification_status = 'approved',
    verified_at = now(),
    verified_by = auth.uid(),
    verification_notes = 'Auto-verified by test system'
  WHERE id = submission_id;
  
  -- Auto-assign dummy pengawas and mandor from test users
  UPDATE public.projects
  SET 
    pengawas_id = (
      SELECT id FROM public.profiles 
      WHERE is_test_user = true 
        AND role = 'pengawas' 
      LIMIT 1
    ),
    status = 'contract_preparation'
  WHERE id = v_project_id;
  
  -- Create dummy mandor assignment
  INSERT INTO public.project_mandors (project_id, mandor_id)
  SELECT v_project_id, id 
  FROM public.profiles 
  WHERE is_test_user = true AND role = 'mandor' 
  LIMIT 1
  ON CONFLICT DO NOTHING;
  
  RETURN jsonb_build_object('success', true, 'project_id', v_project_id);
END;
$$;

-- Auto-approve payment (test mode only)
CREATE OR REPLACE FUNCTION public.auto_approve_payment(payment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_is_test boolean;
  v_user_is_test boolean;
  v_payment_type text;
BEGIN
  -- Check if user is test user
  SELECT public.is_test_user() INTO v_user_is_test;
  
  -- Get payment info
  SELECT py.project_id, owner.is_test_user, py.payment_type
  INTO v_project_id, v_is_test, v_payment_type
  FROM public.payments py
  JOIN public.projects p ON p.id = py.project_id
  JOIN public.profiles owner ON owner.id = p.customer_id
  WHERE py.id = payment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
  END IF;
  
  -- Only allow in test mode with same-mode user
  IF NOT v_is_test OR NOT v_user_is_test THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auto-approve only available in test mode');
  END IF;
  
  -- Auto-approve payment
  UPDATE public.payments
  SET 
    status = 'completed',
    paid_at = now(),
    payment_proof_url = 'test://dummy-payment-proof.jpg',
    verified_by = auth.uid(),
    verified_at = now()
  WHERE id = payment_id;
  
  -- Update project status based on payment type
  IF v_payment_type = 'dp' THEN
    UPDATE public.projects
    SET status = 'in_progress'
    WHERE id = v_project_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'project_id', v_project_id);
END;
$$;

-- Get my projects (test-mode filtered)
CREATE OR REPLACE FUNCTION public.get_my_projects()
RETURNS TABLE (
  id uuid,
  customer_id uuid,
  pengawas_id uuid,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, p.customer_id, p.pengawas_id, p.status, p.created_at
  FROM public.projects p
  JOIN public.profiles owner ON owner.id = p.customer_id
  WHERE owner.is_test_user = public.is_test_user()
    AND (
      p.customer_id = auth.uid() 
      OR p.pengawas_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.project_mandors pm WHERE pm.project_id = p.id AND pm.mandor_id = auth.uid())
    );
$$;

-- Get project members (test-mode aware)
CREATE OR REPLACE FUNCTION public.get_project_members(p_project_id uuid)
RETURNS TABLE (
  user_id uuid,
  role text,
  full_name text,
  phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    pr.id as user_id,
    pr.role,
    pr.full_name,
    pr.phone
  FROM public.profiles pr
  WHERE pr.id IN (
    SELECT p.customer_id FROM public.projects p
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE p.id = p_project_id AND owner.is_test_user = public.is_test_user()
    UNION
    SELECT p.pengawas_id FROM public.projects p
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE p.id = p_project_id AND p.pengawas_id IS NOT NULL AND owner.is_test_user = public.is_test_user()
    UNION
    SELECT pm.mandor_id FROM public.project_mandors pm
    JOIN public.projects p ON p.id = pm.project_id
    JOIN public.profiles owner ON owner.id = p.customer_id
    WHERE pm.project_id = p_project_id AND owner.is_test_user = public.is_test_user()
  );
$$;

COMMENT ON FUNCTION public.auto_verify_submission IS 'Test mode only: auto-verify submission and assign dummy staff.';
COMMENT ON FUNCTION public.auto_approve_payment IS 'Test mode only: auto-approve payment without real payment gateway.';
COMMENT ON FUNCTION public.get_my_projects IS 'Test-aware: returns only same-mode projects for current user.';
COMMENT ON FUNCTION public.get_project_members IS 'Test-aware: returns project members only if same mode.';
