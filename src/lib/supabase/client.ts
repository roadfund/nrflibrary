'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/** Browser-side Supabase client, for Client Components that need auth state directly (e.g. the reset-password page reached from an email link). */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
