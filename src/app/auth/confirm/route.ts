import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureProfileFromSignup } from '@/lib/auth/signup-profile';
import { markEmailVerified } from '@/lib/auth/verification-email';

/**
 * Callback for Supabase Auth email links (signup confirmation, password
 * reset, invite, email change). Handles both the token_hash links from the
 * email templates and the PKCE `code` redirect; creating the session is only
 * possible from a route handler (cookies can't be written from a page
 * render - see src/lib/supabase/server.ts).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next') ?? '/';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  const supabase = await createClient();
  let user = null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) user = data.user;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) user = data.user;
  }

  if (user) {
    await ensureProfileFromSignup(supabase, user);
    await markEmailVerified(user.id);
    return NextResponse.redirect(`${origin}${next}`);
  }

  const isPasswordLink = type === 'recovery' || type === 'invite' || next === '/reset-password';
  return NextResponse.redirect(
    isPasswordLink
      ? `${origin}/forgot-password?error=invalid-link`
      : `${origin}/sign-in?error=invalid-link`,
  );
}
