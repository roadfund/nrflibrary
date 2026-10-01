'use server';

import { siteUrl } from '@/lib/site-url';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createStaffAccountSchema,
  updateUserSchema,
  type CreateStaffAccountInput,
  type UpdateUserInput,
} from '@/lib/validation/staff';
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
  const appUrl = siteUrl;
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

  if (userId === session.user.id) {
    return { success: false, message: 'You cannot suspend your own account.' };
  }

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

export async function updateUser(userId: string, input: UpdateUserInput): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can edit users.' };

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the form for errors.',
    };
  }
  const { name, email } = parsed.data;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle();
  if (!current) return { success: false, message: 'User not found.' };

  const emailChanged = current.email !== email;
  if (emailChanged) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (authError) {
      const message = authError.message.toLowerCase().includes('already been registered')
        ? 'An account with that email already exists.'
        : authError.message;
      return { success: false, message };
    }
  }

  const { error } = await admin.from('profiles').update({ name, email }).eq('id', userId);
  if (error) {
    if (emailChanged) {
      await admin.auth.admin.updateUserById(userId, { email: current.email, email_confirm: true });
    }
    return { success: false, message: error.message };
  }

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'USER_UPDATED',
    targetType: 'User',
    targetId: userId,
    targetLabel: name,
    detail: emailChanged
      ? `Updated details and changed email from ${current.email} to ${email}.`
      : 'Updated details.',
  });

  revalidatePath('/staff/users');
  return { success: true, message: 'User updated.' };
}

export async function deleteUser(userId: string, reassignToId?: string): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can delete users.' };
  if (userId === session.user.id) {
    return { success: false, message: 'You cannot delete your own account.' };
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from('profiles')
    .select('name, email, role, institution_id')
    .eq('id', userId)
    .maybeSingle();
  if (!user) return { success: false, message: 'User not found.' };

  if (user.role === 'INSTITUTION_ADMIN' && user.institution_id) {
    const { count: otherAdmins } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', user.institution_id)
      .eq('role', 'INSTITUTION_ADMIN')
      .eq('active', true)
      .neq('id', userId);
    if (!otherAdmins) {
      return {
        success: false,
        message: `${user.name} is the only admin of their institution. Make another member an institution admin first.`,
      };
    }
  }

  const [owned, uploaded, reviewed, requests, decisions, downloads, audit] = await Promise.all([
    admin
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', userId),
    admin
      .from('content_versions')
      .select('id', { count: 'exact', head: true })
      .eq('uploaded_by_user_id', userId),
    admin
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('reviewer_id', userId),
    admin
      .from('access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    admin
      .from('access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('reviewer_id', userId),
    admin
      .from('download_records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    admin
      .from('audit_log_entries')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', userId),
  ]);

  const history = [
    reviewed.count ? 'content reviews' : null,
    requests.count || decisions.count ? 'access requests' : null,
    downloads.count ? 'download history' : null,
    audit.count ? 'audit history' : null,
  ].filter(Boolean);
  if (history.length > 0) {
    return {
      success: false,
      message: `${user.name} has ${history.join(', ')} on record, so the account cannot be deleted. Suspend it instead.`,
    };
  }

  const ownedCount = owned.count ?? 0;
  const needsReassign = ownedCount > 0 || (uploaded.count ?? 0) > 0;
  let newOwnerName: string | null = null;
  if (needsReassign) {
    if (!reassignToId || reassignToId === userId) {
      return {
        success: false,
        message: `Choose a staff member to take over ${user.name}'s content.`,
      };
    }
    const { data: newOwner } = await admin
      .from('profiles')
      .select('name, role, active')
      .eq('id', reassignToId)
      .maybeSingle();
    if (!newOwner || !newOwner.active || !['SUPER_ADMIN', 'PUBLISHER'].includes(newOwner.role)) {
      return {
        success: false,
        message: 'Content can only be reassigned to an active staff member.',
      };
    }
    newOwnerName = newOwner.name;

    const { error: ownerError } = await admin
      .from('content_items')
      .update({ owner_user_id: reassignToId })
      .eq('owner_user_id', userId);
    if (ownerError) return { success: false, message: ownerError.message };
    const { error: versionError } = await admin
      .from('content_versions')
      .update({ uploaded_by_user_id: reassignToId })
      .eq('uploaded_by_user_id', userId);
    if (versionError) return { success: false, message: versionError.message };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return {
      success: false,
      message: newOwnerName
        ? `Content was reassigned to ${newOwnerName}, but the account could not be deleted: ${error.message}`
        : error.message,
    };
  }

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'USER_DELETED',
    targetType: 'User',
    targetId: userId,
    targetLabel: user.name,
    detail: newOwnerName
      ? `Deleted account ${user.email} and reassigned ${ownedCount} content item${ownedCount === 1 ? '' : 's'} to ${newOwnerName}.`
      : `Deleted account ${user.email}.`,
  });

  revalidatePath('/staff/users');
  return { success: true, message: `${user.name} was deleted.` };
}

export async function confirmUserEmail(userId: string): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can confirm emails.' };

  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from('profiles')
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', userId)
    .is('email_verified_at', null)
    .select('id, name, email')
    .maybeSingle();
  if (error) return { success: false, message: error.message };
  if (!user) return { success: false, message: 'This email is already confirmed.' };

  await admin.auth.admin.updateUserById(userId, { email_confirm: true });

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'USER_EMAIL_VERIFIED',
    targetType: 'User',
    targetId: user.id,
    targetLabel: user.name,
    detail: `Manually confirmed ${user.email}.`,
  });
  revalidatePath('/staff/users');
  return { success: true, message: `${user.email} is now confirmed.` };
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
