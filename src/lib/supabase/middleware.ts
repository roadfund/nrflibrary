import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/**
 * Refreshes the Supabase session on every request so an expiring access
 * token gets rotated before a Server Component ever sees it (Server
 * Components can't write cookies themselves - see server.ts's setAll).
 * Called from src/middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touches the session so a near-expiry token gets refreshed here rather
  // than failing deeper in a Server Component.
  await supabase.auth.getUser();

  return response;
}
