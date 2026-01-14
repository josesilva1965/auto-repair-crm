
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking connection...');
    const { data, error } = await supabase.from('inspection_templates').select('id').limit(1);
    if (error) {
        console.error('Error accessing inspection_templates:', error.message);
        if (error.code === '42P01') {
            console.error('Table does not exist (42P01)!');
        }
    } else {
        console.log('Success! Table exists.');
    }
}

check();
