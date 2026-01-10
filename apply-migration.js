import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync('../../supabase/migrations/1767115200_add_business_hours.sql', 'utf8');

    console.log('Applying migration to create business_hours table...');

    // Split the SQL into individual statements
    const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
        if (statement) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                console.error('Error executing statement:', error);
                // Note: The anon key may not have permissions to execute raw SQL
                // You may need to run this in the Supabase SQL Editor instead
            } else {
                console.log('Success!');
            }
        }
    }

    console.log('\nMigration application complete (or failed due to permissions).');
    console.log('\nIf this failed, please:');
    console.log('1. Go to https://supabase.com/dashboard/project/iygufdkbticpalescryr/sql');
    console.log('2. Copy and paste the contents of supabase/migrations/1767115200_add_business_hours.sql');
    console.log('3. Run the SQL directly in the SQL Editor');
}

applyMigration().catch(console.error);
