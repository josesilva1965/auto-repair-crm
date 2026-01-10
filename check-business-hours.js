import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBusinessHoursTable() {
    console.log('Checking if business_hours table exists...');

    // Try to query the table
    const { data: existing, error: checkError } = await supabase
        .from('business_hours')
        .select('*')
        .limit(1);

    if (checkError) {
        console.error('Table does not exist or is not accessible:', checkError.message);
        console.log('\n⚠️  You need to create the business_hours table manually.');
        console.log('\nPlease follow these steps:');
        console.log('1. Go to: https://supabase.com/dashboard/project/iygufdkbticpalescryr/sql');
        console.log('2. Copy and paste the following SQL:\n');
        console.log('---START SQL---');
        console.log(`
-- Create business_hours table
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week)
);

-- Enable RLS
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow all business_hours" ON business_hours FOR ALL USING (true) WITH CHECK (true);

-- Seed default business hours (Monday-Friday 9:00-18:00, weekends disabled)
INSERT INTO business_hours (day_of_week, start_time, end_time, enabled) VALUES
    (0, '09:00', '18:00', false), -- Sunday
    (1, '09:00', '18:00', true),  -- Monday
    (2, '09:00', '18:00', true),  -- Tuesday
    (3, '09:00', '18:00', true),  -- Wednesday
    (4, '09:00', '18:00', true),  -- Thursday
    (5, '09:00', '18:00', true),  -- Friday
    (6, '09:00', '18:00', false)  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;
        `);
        console.log('---END SQL---\n');
        console.log('3. Click "Run" to execute the SQL');
        console.log('4. Refresh your Bookings page\n');
        return;
    }

    console.log('✅ Table exists! Current data:', existing);
}

createBusinessHoursTable().catch(console.error);
