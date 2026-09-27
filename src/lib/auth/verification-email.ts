import 'server-only';
import type { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/site-url';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function sendVerificationEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
    },
  });
  if (!error) return { error: null };
  if (error.status === 429) {
    return { error: 'Please wait a minute before requesting another email.' };
  }
  return { error: error.message };
}

export async function markEmailVerified(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('profiles')
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', userId)
    .is('email_verified_at', null);
}
