'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSession } from './session';
import {
  profileSchema,
  passwordSchema,
  type ProfileInput,
  type PasswordInput,
} from '@/lib/validation/profile';

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Sign in to update your profile.' };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid profile details.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      name: parsed.data.name,
      ...(parsed.data.organization !== undefined ? { organization: parsed.data.organization } : {}),
      ...(parsed.data.fieldOfStudy !== undefined
        ? { field_of_study: parsed.data.fieldOfStudy }
        : {}),
    })
    .eq('id', session.user.id);

  if (error) return { success: false, message: error.message };

  revalidatePath('/profile');
  return { success: true, message: 'Profile updated.' };
}

export async function changePassword(input: PasswordInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Sign in to change your password.' };

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid password.' };
  }

  const supabase = await createClient();

  // Re-authenticate with the current password before allowing the change -
  // updateUser() alone would let anyone with a live session (e.g. a stolen
  // cookie) set a new password without knowing the old one.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password: parsed.data.currentPassword,
  });
  if (reauthError) {
    return { success: false, message: 'Current password is incorrect.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { success: false, message: error.message };

  return { success: true, message: 'Password updated.' };
}
