import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    try {
        console.log('📋 Applying migration: add_messages_and_reminders\n');

        const migrationPath = join(__dirname, '..', '..', 'supabase', 'migrations', '1767119700_add_messages_and_reminders.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('Migration SQL:');
        console.log('─'.repeat(60));
        console.log(migrationSQL);
        console.log('─'.repeat(60));
        console.log('\n⚠️  Note: This script will verify table access after migration.');
        console.log('⚠️  You need to manually run the SQL above in Supabase SQL Editor.\n');
        console.log('Steps:');
        console.log('1. Go to https://supabase.com/dashboard/project/iygufdkbticpalescryr/sql');
        console.log('2. Copy the SQL above');
        console.log('3. Paste it into the SQL Editor');
        console.log('4. Click "Run"');
        console.log('5. Press Enter here to verify the tables were created\n');

        // Wait for user input
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });

        console.log('\n🔍 Verifying tables...\n');

        // Verify tables were created
        const { data: messages, error: messagesError } = await supabase.from('messages').select('*').limit(1);
        const { data: reminders, error: remindersError } = await supabase.from('service_reminders').select('*').limit(1);

        if (!messagesError) {
            console.log('✅ messages table is accessible');
        } else {
            console.error('❌ messages table error:', messagesError.message);
        }

        if (!remindersError) {
            console.log('✅ service_reminders table is accessible');
        } else {
            console.error('❌ service_reminders table error:', remindersError.message);
        }

        if (!messagesError && !remindersError) {
            console.log('\n🎉 Migration completed successfully!');
        } else {
            console.log('\n⚠️  Some tables could not be verified. Please check the Supabase dashboard.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

applyMigration();
