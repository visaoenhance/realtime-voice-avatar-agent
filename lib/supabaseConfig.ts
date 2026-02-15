/**
 * Supabase Environment Configuration
 * 
 * Dynamically selects credentials based on SUPABASE_ENV:
 * - local: Uses Docker Supabase (127.0.0.1:54321)
 * - remote: Uses production Supabase (ceeklugdyurvxonnhykt.supabase.co)
 * 
 * Set SUPABASE_ENV=remote in .env.local to switch environments.
 */

const env = process.env.SUPABASE_ENV || 'local';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

function getCredentials(): SupabaseCredentials {
  if (env === 'remote') {
    return {
      url: process.env.REMOTE_SUPABASE_URL!,
      anonKey: process.env.REMOTE_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY!,
    };
  }
  
  // Default to local
  return {
    url: process.env.LOCAL_SUPABASE_URL!,
    anonKey: process.env.LOCAL_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY!,
  };
}

export const credentials = getCredentials();
export const currentEnv = env;

// Log which environment is active (only server-side)
if (typeof window === 'undefined') {
  console.log(`[supabase] Using ${currentEnv} environment: ${credentials.url}`);
}
