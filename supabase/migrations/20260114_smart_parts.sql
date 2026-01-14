-- 1. Create Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  supplier TEXT,
  estimated_cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Trigger for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 3. Add supplier_api_id to inventory_parts (optional, for future real API integration)
ALTER TABLE inventory_parts 
ADD COLUMN IF NOT EXISTS supplier_api_id TEXT;

-- 4. Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to purchase_orders" ON purchase_orders
  FOR ALL USING (true) WITH CHECK (true);
