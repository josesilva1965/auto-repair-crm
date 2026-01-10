// Simple test to check if Supabase project is accessible
const SUPABASE_URL = 'https://iygufdkbticpalescryr.supabase.co';

async function testConnection() {
  try {
    console.log('Testing connection to:', SUPABASE_URL);
    const response = await fetch(SUPABASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    const text = await response.text();
    console.log('Response body:', text.substring(0, 500));
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

testConnection();
