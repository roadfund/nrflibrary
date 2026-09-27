'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAccountHomeHref } from '@/lib/navigation';
import {
  signInSchema,
  createAccountSchema,
  type SignInInput,
  type CreateAccountInput,
} from '@/lib/validation/account';
import type { User } from '@/lib/types';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, active')
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
    redirectTo: getAccountHomeHref(profile.role),
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

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
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

  let institutionId: string | null = null;
  let role: User['role'] = data.accountType === 'RESEARCHER' ? 'RESEARCHER' : 'STUDENT';

  if (data.accountType === 'INSTITUTION') {
    role = 'INSTITUTION_ADMIN';
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .insert({
        name: data.institutionName!,
        type: data.institutionType!,
        country: data.institutionCountry!,
      })
      .select('id')
      .single();
    if (institutionError || !institution) {
      return {
        success: false,
        message: institutionError?.message ?? 'Could not register your institution.',
      };
    }
    institutionId = institution.id;

    const { error: memberError } = await supabase.from('institution_members').insert({
      institution_id: institutionId,
      user_id: authUser.id,
      email: data.email,
      name: data.name,
      role: 'INSTITUTION_ADMIN',
      status: 'ACTIVE',
      joined_at: new Date().toISOString(),
    });
    if (memberError) {
      return { success: false, message: memberError.message };
    }
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authUser.id,
    email: data.email,
    name: data.name,
    role,
    institution_id: institutionId,
    organization:
      data.accountType === 'INSTITUTION' ? data.institutionName! : (data.organization ?? null),
    field_of_study: data.fieldOfStudy ?? null,
  });
  if (profileError) {
    return { success: false, message: profileError.message };
  }

  return {
    success: true,
    message: 'Account created. Welcome to the National Road Fund Research Library.',
    redirectTo: getAccountHomeHref(role),
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
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
