/**
 * Server wrapper for EnvironmentBadge that reads SUPABASE_ENV
 */

import { currentEnv } from '@/lib/supabaseConfig';
import EnvironmentBadge from './EnvironmentBadge';

export default function EnvironmentBadgeServer() {
  return <EnvironmentBadge env={currentEnv as 'local' | 'remote'} />;
}
