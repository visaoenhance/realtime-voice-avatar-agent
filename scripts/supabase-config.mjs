/**
 * Shared Supabase configuration for Node.js scripts
 * Reads SUPABASE_ENV and returns appropriate credentials
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const env = process.env.SUPABASE_ENV || 'local';

export function getSupabaseConfig() {
  if (env === 'remote') {
    return {
      url: process.env.REMOTE_SUPABASE_URL,
      anonKey: process.env.REMOTE_SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY,
      env: 'remote'
    };
  }
  
  return {
    url: process.env.LOCAL_SUPABASE_URL,
    anonKey: process.env.LOCAL_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY,
    env: 'local'
  };
}

export const config = getSupabaseConfig();

// Log which environment is active
console.log(`[supabase-config] Using ${config.env} environment: ${config.url}`);
