-- Update respond_to_estimate to handle Auto-Ordering
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
  v_work_order_id UUID;
  v_current_status TEXT;
  v_new_status TEXT;
  v_item RECORD;
  v_current_stock INTEGER;
BEGIN
  -- Validate Action
  IF p_action NOT IN ('approve', 'reject') THEN
    RETURN json_build_object('success', false, 'message', 'Invalid action');
  END IF;

  -- Get Estimate Details
  SELECT id, status, work_order_id INTO v_estimate_id, v_current_status, v_work_order_id
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

  -- AUTO-UPDATE WORK ORDER STATUS TO 'in-progress'
  IF p_action = 'approve' AND v_work_order_id IS NOT NULL THEN
    UPDATE work_orders
    SET status = 'in-progress'
    WHERE id = v_work_order_id;

    -- SMART PARTS AUTO-ORDERING LOGIC
    FOR v_item IN 
      SELECT * FROM work_order_items 
      WHERE work_order_id = v_work_order_id AND item_type = 'part'
    LOOP
       -- Check inventory
       SELECT quantity INTO v_current_stock 
       FROM inventory_parts 
       WHERE name = v_item.description
       LIMIT 1;
       
       -- If part not found in inventory OR stock is insufficient (mock logic: stock < needed)
       -- If v_current_stock IS NULL, it means it's a special order part not in inventory system, so we definitely order it.
       IF v_current_stock IS NULL OR v_current_stock < v_item.quantity THEN
         -- Create Purchase Order
         INSERT INTO purchase_orders (part_number, part_name, quantity, work_order_id, status, estimated_cost)
         VALUES (
            'AUTO-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6), -- Mock Part Number
            v_item.description, 
            v_item.quantity, 
            v_work_order_id, 
            'pending',
            v_item.unit_price * 0.6 -- Estimated cost
         );
         
         -- Notify Shop about PO
         INSERT INTO notifications (type, title, message, work_order_id, customer_id, read)
         VALUES (
            'message_received',
            'Auto-Order Created',
            'Purchase Order created for ' || v_item.description,
            v_work_order_id,
            (SELECT customer_id FROM estimates WHERE id = v_estimate_id),
            false
         );
       END IF;
    END LOOP;
  END IF;

  -- Create Notification for Shop (Approval/Rejection)
  INSERT INTO notifications (type, title, message, work_order_id, customer_id, read)
  VALUES (
    CASE WHEN p_action = 'approve' THEN 'estimate_approved' ELSE 'estimate_rejected' END,
    CASE WHEN p_action = 'approve' THEN 'Estimate Approved' ELSE 'Estimate Rejected' END,
    'Customer responded via online link.' || CASE WHEN p_action = 'approve' THEN ' Work Order updated to In Progress.' ELSE '' END,
    v_work_order_id,
    (SELECT customer_id FROM estimates WHERE id = v_estimate_id),
    false
  );

  RETURN json_build_object('success', true, 'status', v_new_status);
END;
$$ LANGUAGE plpgsql;
