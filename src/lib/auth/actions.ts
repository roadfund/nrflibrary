'use server';

import { siteUrl } from '@/lib/site-url';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAccountHomeHref } from '@/lib/navigation';
import {
  signInSchema,
  createAccountSchema,
  type SignInInput,
  type CreateAccountInput,
} from '@/lib/validation/account';
import {
  createProfileRecords,
  ensureProfileFromSignup,
  signupDetailsSchema,
} from '@/lib/auth/signup-profile';
import { isVerificationOverdue } from '@/lib/auth/email-verification';
import { sendVerificationEmail } from '@/lib/auth/verification-email';

export interface AuthResult {
  success: boolean;
  message: string;
  redirectTo?: string;
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid sign-in details.',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { success: false, message: 'No account found with that email and password.' };
  }

  await ensureProfileFromSignup(supabase, data.user);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, active, email_verified_at, created_at')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { success: false, message: 'No account found with that email and password.' };
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return {
      success: false,
      message: 'This account has been suspended. Contact an administrator.',
    };
  }

  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id);

  return {
    success: true,
    message: `Welcome back, ${profile.name.split(' ')[0]}.`,
    redirectTo: isVerificationOverdue({
      emailVerified: Boolean(profile.email_verified_at),
      createdAt: profile.created_at,
    })
      ? '/verify-email'
      : getAccountHomeHref(profile.role),
  };
}

export async function createAccount(input: CreateAccountInput): Promise<AuthResult> {
  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the form for errors.',
    };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const details = signupDetailsSchema.parse(data);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
      data: { signup: details },
    },
  });
  if (signUpError) {
    const message = signUpError.message.toLowerCase().includes('already registered')
      ? 'An account with that email already exists.'
      : signUpError.message;
    return { success: false, message };
  }

  const authUser = signUpData.user;
  if (!authUser) {
    return { success: false, message: 'Could not create your account. Try again.' };
  }

  // No active session means the project requires email confirmation before
  // sign-in - the profile/institution rows get created on first sign-in
  // instead, since RLS needs an authenticated request to write them.
  if (!signUpData.session) {
    return {
      success: true,
      message: 'Check your email to confirm your account, then sign in.',
      redirectTo: '/sign-in',
    };
  }

  const result = await createProfileRecords(supabase, authUser.id, details);
  if ('error' in result) {
    return { success: false, message: result.error };
  }

  await sendVerificationEmail(supabase, data.email);

  return {
    success: true,
    message: 'Account created. Check your email to confirm your address.',
    redirectTo: getAccountHomeHref(result.role),
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

const emailSchema = z.string().email('Enter a valid email address.');

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Enter a valid email address.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  // Supabase itself never reveals whether the email matched an account, to
  // avoid leaking which addresses have accounts - this message stays
  // generic even on error for the same reason, except for real failures
  // (rate limiting, misconfiguration) worth surfacing.
  if (error && error.status !== 400) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  };
}

const newPasswordSchema = z.string().min(8, 'Use at least 8 characters.').max(72);

export async function resetPassword(newPassword: string): Promise<AuthResult> {
  const parsed = newPasswordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Use at least 8 characters.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: 'Password updated. You can now sign in.',
    redirectTo: '/sign-in',
  };
}
