import { createClient } from '@supabase/supabase-js';
import { credentials } from './supabaseConfig';

const supabaseUrl = credentials.url;
const supabaseServiceRoleKey = credentials.serviceRoleKey;

if ((!supabaseUrl || !supabaseServiceRoleKey) && typeof window === 'undefined') {
  console.warn('[supabase] Credentials not set. Supabase-dependent features will be disabled.');
}

export const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

export const DEMO_PROFILE_ID = process.env.DEMO_PROFILE_ID ?? '00000000-0000-0000-0000-000000000001';
