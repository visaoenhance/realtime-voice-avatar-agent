// Test environment configuration
require('dotenv').config({ path: '.env.local' });

const env = process.env.SUPABASE_ENV || 'local';

console.log('Current SUPABASE_ENV:', env);
console.log('');

if (env === 'remote') {
  console.log('Using REMOTE credentials:');
  console.log('  URL:', process.env.REMOTE_SUPABASE_URL);
  console.log('  Anon Key:', process.env.REMOTE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  console.log('  Service Key:', process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
} else {
  console.log('Using LOCAL credentials:');
  console.log('  URL:', process.env.LOCAL_SUPABASE_URL);
  console.log('  Anon Key:', process.env.LOCAL_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  console.log('  Service Key:', process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
}

console.log('');
console.log('✅ Configuration loaded successfully');
