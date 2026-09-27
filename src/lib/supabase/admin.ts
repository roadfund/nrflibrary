import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env';

/**
 * Service-role client that bypasses Row Level Security. Server-only - never
 * import this from a Client Component or anything that could ship the
 * service-role key to the browser. Reserved for admin operations RLS can't
 * express (e.g. looking up a profile by email before the user has a
 * session).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
