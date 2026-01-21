import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRPC() {
    console.log('Testing get_customer_portal_data RPC...');

    // UUID v4 format
    const dummyToken = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase.rpc('get_customer_portal_data', {
        p_token: dummyToken
    });

    if (error) {
        console.error('RPC Call Failed:', error.message);
        if (error.code === '42883') { // undefined_function
            console.log('DIAGNOSIS: The function does not exist. The migration was NOT successfully applied.');
        } else {
            console.log('DIAGNOSIS: The function exists but failed with another error.');
        }
    } else {
        console.log('RPC Call Succeeded (Function exists).');
        console.log('Response:', data);

        if (data && data.success === false && data.message === 'Invalid token') {
            console.log('DIAGNOSIS: Success! The RPC exists and is working correctly. The "Access Denied" error is just due to using a token that is not in the DB.');
        } else {
            console.log('DIAGNOSIS: Unexpected response format.');
        }
    }
}

verifyRPC();
