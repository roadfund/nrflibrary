'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStaffAccountSchema, type CreateStaffAccountInput } from '@/lib/validation/staff';
import { logAudit } from './audit-log';
import type { Role } from '@/lib/types';

export interface ActionResult {
  success: boolean;
  message: string;
}

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null;
  }
  return session;
}

export async function createStaffAccount(input: CreateStaffAccountInput): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can add staff accounts.' };

  const parsed = createStaffAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the form for errors.',
    };
  }
  const { name, email, role, isReviewer } = parsed.data;

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
  });
  if (inviteError || !invited.user) {
    const message = inviteError?.message.toLowerCase().includes('already been registered')
      ? 'An account with that email already exists.'
      : (inviteError?.message ?? 'Could not invite this user.');
    return { success: false, message };
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: invited.user.id,
    email,
    name,
    role,
    is_reviewer: role === 'PUBLISHER' ? isReviewer : false,
    active: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return { success: false, message: profileError.message };
  }

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'STAFF_ACCOUNT_CREATED',
    targetType: 'User',
    targetId: invited.user.id,
    targetLabel: name,
    detail: `Invited ${email} as ${role === 'PUBLISHER' ? 'Publisher' : 'Super Admin'}.`,
  });

  revalidatePath('/staff/users');
  return { success: true, message: `Invite sent to ${email}.` };
}

export async function changeUserRole(
  userId: string,
  role: Role,
  isReviewer: boolean,
): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can change roles.' };

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from('profiles')
    .update({ role, is_reviewer: role === 'PUBLISHER' ? isReviewer : false })
    .eq('id', userId)
    .select('id, name')
    .single();

  if (error || !user) return { success: false, message: error?.message ?? 'User not found.' };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'USER_ROLE_CHANGED',
    targetType: 'User',
    targetId: user.id,
    targetLabel: user.name,
    detail: `Changed role to ${role}${role === 'PUBLISHER' && isReviewer ? ' with reviewer permission' : ''}.`,
  });
  revalidatePath('/staff/users');
  return { success: true, message: 'Role updated.' };
}

export async function toggleUserActive(userId: string): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can change account status.' };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from('profiles')
    .select('active, name')
    .eq('id', userId)
    .maybeSingle();
  if (!current) return { success: false, message: 'User not found.' };

  const nextActive = !current.active;
  const { error } = await supabase.from('profiles').update({ active: nextActive }).eq('id', userId);
  if (error) return { success: false, message: error.message };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: nextActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
    targetType: 'User',
    targetId: userId,
    targetLabel: current.name,
    detail: nextActive ? 'Account reactivated.' : 'Account suspended.',
  });

  revalidatePath('/staff/users');
  return { success: true, message: nextActive ? 'Account reactivated.' : 'Account suspended.' };
}

export async function verifyInstitution(institutionId: string): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can verify institutions.' };

  const supabase = await createClient();
  const { data: institution, error } = await supabase
    .from('institutions')
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq('id', institutionId)
    .select('id, name')
    .single();

  if (error || !institution)
    return { success: false, message: error?.message ?? 'Institution not found.' };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'INSTITUTION_VERIFIED',
    targetType: 'Institution',
    targetId: institution.id,
    targetLabel: institution.name,
    detail: 'Verified institution registration.',
  });

  revalidatePath('/staff/institutions');
  return { success: true, message: 'Institution verified.' };
}
