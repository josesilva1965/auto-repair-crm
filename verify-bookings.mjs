import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying bookings table...');
    const { data, error } = await supabase.from('bookings').select('*').limit(1);

    if (error) {
        console.error('Error accessing bookings table:', error.message);
        if (error.code === '42P01') {
            console.log('Table "bookings" does not exist.');
        }
    } else {
        console.log('Success! Bookings table exists.');
    }
}

verify();
