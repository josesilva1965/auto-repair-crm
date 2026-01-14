-- 1. Add approval_token to estimates table
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS approval_token UUID DEFAULT gen_random_uuid();

-- Create index for fast lookups by token
CREATE INDEX IF NOT EXISTS idx_estimates_approval_token ON estimates(approval_token);

-- 2. RPC Function: Get estimate details by token (Public access)
-- Returns JSON to easily handle related data (customer, items) in one go
CREATE OR REPLACE FUNCTION get_estimate_by_token(p_token UUID)
RETURNS JSON
SECURITY DEFINER -- Runs with privileges of creator (postgres), bypassing RLS for anon users
AS $$
DECLARE
  v_estimate RECORD;
  v_customer RECORD;
  v_items RECORD;
  v_vehicle RECORD;
  v_work_order_id UUID;
  v_result JSON;
BEGIN
  -- Fetch estimate
  SELECT * INTO v_estimate
  FROM estimates
  WHERE approval_token = p_token
  LIMIT 1;

  IF v_estimate IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch customer
  SELECT * INTO v_customer
  FROM customers
  WHERE id = v_estimate.customer_id;

  -- Fetch items (from work_order_items via work_order_id)
  v_work_order_id := v_estimate.work_order_id;

  -- Fetch vehicle info via work order
  SELECT v.* INTO v_vehicle
  FROM work_orders w
  JOIN vehicles v ON w.vehicle_id = v.id
  WHERE w.id = v_work_order_id;

  -- Construct Result
  SELECT json_build_object(
    'id', v_estimate.id,
    'estimate_number', v_estimate.estimate_number,
    'subtotal', v_estimate.subtotal,
    'expecting_response', v_estimate.status = 'sent', -- Only allow action if status is 'sent'
    'status', v_estimate.status,
    'total', v_estimate.total,
    'tax', v_estimate.tax,
    'created_at', v_estimate.created_at,
    'customer_name', v_customer.name,
    'vehicle_info', CONCAT(v_vehicle.year, ' ', v_vehicle.make, ' ', v_vehicle.model),
    'items', (
      SELECT json_agg(json_build_object(
        'description', description,
        'quantity', quantity,
        'unit_price', unit_price,
        'total', quantity * unit_price
      ))
      FROM work_order_items
      WHERE work_order_id = v_work_order_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 3. RPC Function: Approve or Reject Estimate
CREATE OR REPLACE FUNCTION respond_to_estimate(
  p_token UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  v_estimate_id UUID;
  v_current_status TEXT;
  v_new_status TEXT;
BEGIN
  -- Validate Action
  IF p_action NOT IN ('approve', 'reject') THEN
    RETURN json_build_object('success', false, 'message', 'Invalid action');
  END IF;

  -- Get Estimate ID and Status
  SELECT id, status INTO v_estimate_id, v_current_status
  FROM estimates
  WHERE approval_token = p_token;

  IF v_estimate_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Estimate not found');
  END IF;

  IF v_current_status != 'sent' AND v_current_status != 'draft' THEN
    RETURN json_build_object('success', false, 'message', 'Estimate already responded to');
  END IF;

  -- Determine new status
  IF p_action = 'approve' THEN
    v_new_status := 'approved';
  ELSE
    v_new_status := 'rejected';
  END IF;

  -- Update Estimate
  UPDATE estimates
  SET 
    status = v_new_status,
    approved_at = CASE WHEN p_action = 'approve' THEN NOW() ELSE NULL END,
    notes = CASE 
      WHEN p_reason IS NOT NULL THEN 
        COALESCE(notes, '') || E'\nCustomer Reason: ' || p_reason 
      ELSE notes 
    END
  WHERE id = v_estimate_id;

  -- Update Work Order Status (if approved)
  IF p_action = 'approve' THEN
    UPDATE work_orders
    SET status = 'approved'
    WHERE id = (SELECT work_order_id FROM estimates WHERE id = v_estimate_id);
  END IF;

  -- Create Notification for Shop
  INSERT INTO notifications (type, title, message, work_order_id, customer_id, read)
  SELECT 
    CASE WHEN p_action = 'approve' THEN 'estimate_approved' ELSE 'estimate_rejected' END,
    CASE WHEN p_action = 'approve' THEN 'Estimate Approved' ELSE 'Estimate Rejected' END,
    'Customer responded via online link.' || CASE WHEN p_action = 'approve' THEN ' Work Order status updated to Approved.' ELSE '' END,
    work_order_id,
    customer_id,
    false
  FROM estimates
  WHERE id = v_estimate_id;

  RETURN json_build_object('success', true, 'status', v_new_status);
END;
$$ LANGUAGE plpgsql;

-- 4. Update Work Order Constraints to allow 'approved' status
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check 
  CHECK (status IN ('pending', 'approved', 'testing', 'in-progress', 'completed', 'cancelled'));
