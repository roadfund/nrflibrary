import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Create a fresh one per request - never module-level cache
 * it, since it's bound to this request's cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written. Harmless as long as middleware.ts is refreshing the
          // session on every request (see src/middleware.ts).
        }
      },
    },
  });
}
