'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isStaffRole } from '@/lib/types/roles';
import { GRANT_CATEGORY_LABELS } from '@/lib/types/plan';
import { formatDate } from '@/lib/format';
import {
  grantSubscriptionSchema,
  type GrantSubscriptionInput,
} from '@/lib/validation/subscription-grant';
import { logAudit } from './audit-log';
import type { ActionResult } from './user-mutations';

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') return null;
  return session;
}

function revalidateSubscriptionViews() {
  revalidatePath('/staff/subscriptions');
  revalidatePath('/staff/institutions');
  revalidatePath('/dashboard');
  revalidatePath('/billing');
  revalidatePath('/institution/billing');
  revalidatePath('/catalogue');
}

export async function grantSubscription(input: GrantSubscriptionInput): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can grant subscriptions.' };

  const parsed = grantSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  }
  const { ownerType, ownerId, endDate, category, note, seats } = parsed.data;
  const admin = createAdminClient();

  let recipientLabel: string;
  if (ownerType === 'USER') {
    const { data: profile } = await admin
      .from('profiles')
      .select('name, email, role')
      .eq('id', ownerId)
      .maybeSingle();
    if (!profile) return { success: false, message: 'User not found.' };
    if (isStaffRole(profile.role)) {
      return { success: false, message: 'Staff accounts already have full access.' };
    }
    if (profile.role === 'INSTITUTION_ADMIN' || profile.role === 'INSTITUTION_MEMBER') {
      return {
        success: false,
        message: 'Institution accounts get access through their institution. Grant it there.',
      };
    }
    recipientLabel = `${profile.name} (${profile.email})`;
  } else {
    const { data: institution } = await admin
      .from('institutions')
      .select('name')
      .eq('id', ownerId)
      .maybeSingle();
    if (!institution) return { success: false, message: 'Institution not found.' };
    recipientLabel = institution.name;
  }

  const { data: plan } = await admin
    .from('plans')
    .select('id, code')
    .eq('code', 'STANDARD')
    .single();
  if (!plan) return { success: false, message: 'No subscription plan is set up.' };

  const { data: existing } = await admin
    .from('subscriptions')
    .select('id, status, granted_by, current_period_end, billing_interval, seats_used')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (
    existing &&
    existing.granted_by === null &&
    existing.status === 'ACTIVE' &&
    new Date(existing.current_period_end) > new Date()
  ) {
    return {
      success: false,
      message: `${recipientLabel} already has an active paid subscription.`,
    };
  }

  const now = new Date();
  const fields = {
    plan_id: plan.id,
    plan_code: plan.code,
    status: 'ACTIVE' as const,
    seats: ownerType === 'INSTITUTION' ? (seats ?? null) : null,
    payment_method_type: null,
    payment_reference: null,
    current_period_start: now.toISOString(),
    current_period_end: new Date(`${endDate}T23:59:59Z`).toISOString(),
    cancel_at_period_end: true,
    granted_by: session.user.id,
    grant_category: category,
    grant_note: note || null,
  };

  const { error } = existing
    ? await admin.from('subscriptions').update(fields).eq('id', existing.id)
    : await admin.from('subscriptions').insert({
        ...fields,
        id: `sub_${Date.now()}`,
        owner_type: ownerType,
        owner_id: ownerId,
        billing_interval: 'ANNUAL',
        seats_used: ownerType === 'INSTITUTION' ? 0 : null,
      });
  if (error) return { success: false, message: 'Could not grant the subscription. Try again.' };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'SUBSCRIPTION_GRANTED',
    targetType: ownerType === 'USER' ? 'User' : 'Institution',
    targetId: ownerId,
    targetLabel: recipientLabel,
    detail: `Granted a ${GRANT_CATEGORY_LABELS[category].toLowerCase()} subscription until ${formatDate(fields.current_period_end)}${seats && ownerType === 'INSTITUTION' ? ` with ${seats} seats` : ''}.${note ? ` Note: ${note}` : ''}`,
  });

  revalidateSubscriptionViews();
  return {
    success: true,
    message: `${recipientLabel} has access until ${formatDate(fields.current_period_end)}.`,
  };
}

export async function revokeSubscriptionGrant(subscriptionId: string): Promise<ActionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, message: 'Only a super admin can revoke subscriptions.' };

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('id, owner_type, owner_id, granted_by')
    .eq('id', subscriptionId)
    .maybeSingle();
  if (!subscription) return { success: false, message: 'Subscription not found.' };
  if (subscription.granted_by === null) {
    return { success: false, message: 'Only granted subscriptions can be revoked here.' };
  }

  const { error } = await admin
    .from('subscriptions')
    .update({ status: 'CANCELED', current_period_end: new Date().toISOString() })
    .eq('id', subscriptionId);
  if (error) return { success: false, message: 'Could not revoke the subscription. Try again.' };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'SUBSCRIPTION_REVOKED',
    targetType: subscription.owner_type === 'USER' ? 'User' : 'Institution',
    targetId: subscription.owner_id,
    targetLabel: subscription.id,
    detail: 'Revoked a granted subscription.',
  });

  revalidateSubscriptionViews();
  return { success: true, message: 'Subscription revoked.' };
}
