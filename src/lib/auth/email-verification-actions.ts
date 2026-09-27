'use server';

import { createClient } from '@/lib/supabase/server';
import { getSessionIncludingUnverified } from './session';
import { sendVerificationEmail } from './verification-email';
import type { AuthResult } from './actions';

export async function resendVerificationEmail(): Promise<AuthResult> {
  const session = await getSessionIncludingUnverified();
  if (!session) {
    return { success: false, message: 'Sign in to resend the confirmation email.' };
  }
  if (session.user.emailVerified) {
    return { success: true, message: 'Your email is already confirmed.' };
  }

  const supabase = await createClient();
  const { error } = await sendVerificationEmail(supabase, session.user.email);
  if (error) {
    return { success: false, message: error };
  }

  return { success: true, message: `Confirmation email sent to ${session.user.email}.` };
}
