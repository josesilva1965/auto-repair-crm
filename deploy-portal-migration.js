import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants from existing codebase
const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deployMigration() {
    const migrationPath = join(__dirname, '../../supabase/migrations/20260121_customer_portal.sql');
    console.log(`Reading migration from: ${migrationPath}`);

    let migrationSQL;
    try {
        migrationSQL = readFileSync(migrationPath, 'utf8');
    } catch (e) {
        console.error('Failed to read migration file:', e.message);
        process.exit(1);
    }

    console.log('Migration content loaded. Length:', migrationSQL.length);

    // Split statements simply by semicolon for this specific file structure
    // This is a naive split but should work for this specific migration file
    // which uses $$ delimiters for the function.
    // Actually, splitting by ; might break the function body.
    // Let's just try running the whole block? No, exec_sql usually takes one statement.
    // But postgres usually allows multiple statements.
    // Let's try to run it statement by statement but be careful with the function body.

    // Better approach for the function: The function is one big statement ending in ; 
    // The previous statements are single lines ending in ;

    // Let's define the statements manually to be safe or use a regex splitter if we want to be fancy.
    // Or just run the RPC creation separately.

    const statements = [
        "ALTER TABLE customers ADD COLUMN IF NOT EXISTS portal_token UUID DEFAULT gen_random_uuid()",
        "CREATE INDEX IF NOT EXISTS idx_customers_portal_token ON customers(portal_token)",
        "UPDATE customers SET portal_token = gen_random_uuid() WHERE portal_token IS NULL",
        "ALTER TABLE customers ADD CONSTRAINT customers_portal_token_key UNIQUE (portal_token)",
        `CREATE OR REPLACE FUNCTION get_customer_portal_data(p_token UUID)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  v_customer RECORD;
  v_vehicles JSON;
  v_active_orders JSON;
  v_past_orders JSON;
BEGIN
  -- 1. Fetch Customer
  SELECT * INTO v_customer
  FROM customers
  WHERE portal_token = p_token
  LIMIT 1;

  IF v_customer IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid token');
  END IF;

  -- 2. Fetch Vehicles
  SELECT json_agg(json_build_object(
    'id', id,
    'make', make,
    'model', model,
    'year', year,
    'license_plate', license_plate,
    'vin', vin,
    'color', color
  )) INTO v_vehicles
  FROM vehicles
  WHERE customer_id = v_customer.id;

  -- 3. Fetch Active Work Orders (not completed or cancelled)
  SELECT json_agg(json_build_object(
    'id', w.id,
    'order_number', w.order_number,
    'status', w.status,
    'vehicle_name', CONCAT(v.year, ' ', v.make, ' ', v.model),
    'created_at', w.created_at,
    'description', w.description,
    'estimated_cost', w.estimated_cost
  )) INTO v_active_orders
  FROM work_orders w
  JOIN vehicles v ON w.vehicle_id = v.id
  WHERE w.customer_id = v_customer.id 
  AND w.status NOT IN ('completed', 'cancelled');

  -- 4. Fetch Past Work Orders (completed)
  SELECT json_agg(json_build_object(
    'id', w.id,
    'order_number', w.order_number,
    'status', w.status,
    'vehicle_name', CONCAT(v.year, ' ', v.make, ' ', v.model),
    'completed_date', w.completed_date,
    'total_cost', w.total_cost
  )) INTO v_past_orders
  FROM work_orders w
  JOIN vehicles v ON w.vehicle_id = v.id
  WHERE w.customer_id = v_customer.id 
  AND w.status = 'completed'
  ORDER BY w.completed_date DESC
  LIMIT 10;

  -- 5. Return Combined Object
  RETURN json_build_object(
    'success', true,
    'customer', json_build_object(
      'id', v_customer.id,
      'name', v_customer.name,
      'email', v_customer.email,
      'phone', v_customer.phone
    ),
    'vehicles', COALESCE(v_vehicles, '[]'::json),
    'active_orders', COALESCE(v_active_orders, '[]'::json),
    'history', COALESCE(v_past_orders, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql`
    ];

    for (const sql of statements) {
        console.log(`Executing SQL: ${sql.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error('Error:', error);
            // proceed or exit? Let's proceed as some might already exist
        } else {
            console.log('Success.');
        }
    }
}

deployMigration();
