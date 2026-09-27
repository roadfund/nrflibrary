import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback for Supabase Auth email links (password reset, invite, email
 * change). Supabase's hosted verify endpoint redirects here with a `code`
 * once the link itself is validated; exchanging it for a session is only
 * possible from a route handler (cookies can't be written from a page
 * render - see src/lib/supabase/server.ts).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/forgot-password?error=invalid-link`);
}
