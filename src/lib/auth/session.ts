import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@/lib/types';

/**
 * Canonical session accessor. Every server component, route handler, and
 * server action should import `getSession` (or `requireUser`) from
 * `@/lib/auth`, not `@/lib/supabase/server` directly, so the session shape
 * stays centralized here.
 *
 * Uses `auth.getUser()` rather than `auth.getSession()` - the former
 * revalidates the token against Supabase's Auth server instead of trusting
 * whatever is in the (spoofable) cookie-derived JWT. That's a real network
 * round trip, and both a layout and its page routinely call requireX() (and
 * therefore this) independently for the same request - wrapped in React's
 * `cache()` so every caller in one request shares a single call instead of
 * each paying that round trip again.
 */
export const getSession = cache(async (): Promise<{ user: User } | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();
  if (!profile) return null;

  return {
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      isReviewer: profile.is_reviewer,
      institutionId: profile.institution_id,
      organization: profile.organization,
      fieldOfStudy: profile.field_of_study,
      emailVerified: Boolean(authUser.email_confirmed_at),
      active: profile.active,
      createdAt: profile.created_at,
      lastLoginAt: profile.last_login_at,
    },
  };
});
