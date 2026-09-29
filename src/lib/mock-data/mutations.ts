'use server';

import { revalidatePath } from 'next/cache';
import { newId } from '@/lib/ids';
import { resultFromWrite } from '@/lib/data/write-result';
import { getSession } from '@/lib/auth';
import { beginOrangeMoneySubscription } from '@/lib/payments/collect-orange-money';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateAccess } from '@/lib/access-control';
import { isInstitutionRole, isStaffRole } from '@/lib/types/roles';
import { accessRequestSchema, type AccessRequestInput } from '@/lib/validation/access-request';
import { getAccessRequestsForUser, hasApprovedAccessGrant } from './access-requests';
import { isItemSaved } from './activity';
import { getContentById, getVersionsForContent } from './content';
import { getViewerSubscription } from './queries';
import { getSubscriptionByOwner } from './subscriptions';
import { getPlanByCode } from './plans';
import type {
  BillingInterval,
  ContentItem,
  FileFormat,
  PlanCode,
  PaymentMethodType,
} from '@/lib/types';

export interface ActionResult {
  success: boolean;
  message: string;
  awaitingApproval?: boolean;
}

function saved(
  result: { error: { message: string } | null; data: readonly { id: string }[] | null },
  successMessage: string,
  failureMessage: string,
): ActionResult {
  return resultFromWrite(
    { error: result.error, rowCount: result.data?.length ?? 0 },
    successMessage,
    failureMessage,
  );
}

export async function submitAccessRequest(input: AccessRequestInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Sign in to request access.' };
  }

  const parsed = accessRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid request.' };
  }

  const item = await getContentById(parsed.data.contentItemId);
  if (!item) {
    return { success: false, message: 'Publication not found.' };
  }

  const existingRequests = await getAccessRequestsForUser(session.user.id);
  const alreadyPending = existingRequests.some(
    (request) =>
      request.contentItemId === item.id &&
      (request.status === 'PENDING' || request.status === 'NEEDS_INFO'),
  );
  if (alreadyPending) {
    return { success: false, message: 'You already have a pending request for this item.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('access_requests').insert({
    id: newId('areq'),
    content_item_id: item.id,
    content_title: item.title,
    user_id: session.user.id,
    user_name: session.user.name,
    purpose: parsed.data.purpose,
    institution: parsed.data.institution,
    intended_use: parsed.data.intendedUse,
    requested_access_days: parsed.data.requestedAccessDays,
    status: 'PENDING',
  });
  if (error) {
    return { success: false, message: 'Could not submit request. Try again.' };
  }

  revalidatePath(`/catalogue/${item.slug}`);
  revalidatePath('/requests');
  revalidatePath('/staff/requests');

  return {
    success: true,
    message: 'Access request submitted. You will be notified of the decision.',
  };
}

export async function toggleSavedItem(contentItemId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Sign in to save items.' };
  }

  const supabase = await createClient();
  const alreadySaved = await isItemSaved(session.user.id, contentItemId);

  if (alreadySaved) {
    const removed = saved(
      await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('content_item_id', contentItemId)
        .select('id'),
      'Removed from saved items.',
      'Could not update your saved items.',
    );
    if (!removed.success) return removed;
    revalidatePath('/saved');
    return removed;
  }

  const inserted = saved(
    await supabase
      .from('saved_items')
      .insert({ id: newId('save'), user_id: session.user.id, content_item_id: contentItemId })
      .select('id'),
    'Saved to your reading list.',
    'Could not update your saved items.',
  );
  if (!inserted.success) return inserted;
  revalidatePath('/saved');
  return inserted;
}

type ViewerPermission = 'canDownload' | 'canPreview';

async function checkViewerPermission(
  item: ContentItem,
  permission: ViewerPermission,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  const isPublic = item.status === 'PUBLISHED' && item.accessLevel === 'PUBLIC';

  if (!session && !isPublic) {
    return {
      ok: false,
      message: permission === 'canDownload' ? 'Sign in to download.' : 'Sign in to preview.',
    };
  }
  if (!session || isPublic || isStaffRole(session.user.role)) {
    return { ok: true };
  }

  const isInstitutionMember = isInstitutionRole(session.user.role);
  const ownerType = isInstitutionMember ? 'INSTITUTION' : 'USER';
  const ownerId = isInstitutionMember ? (session.user.institutionId ?? '') : session.user.id;
  const { subscription } = await getViewerSubscription(ownerType, ownerId, session.user.id);

  const access = evaluateAccess({
    item: {
      status: item.status,
      accessLevel: item.accessLevel,
      allowedPlanCodes: item.allowedPlanCodes,
    },
    user: { role: session.user.role, isReviewer: session.user.isReviewer },
    subscription,
    hasApprovedAccessGrant: await hasApprovedAccessGrant(session.user.id, item.id),
  });
  if (!access[permission]) {
    return { ok: false, message: 'You do not have permission to access this item.' };
  }
  return { ok: true };
}

export interface DownloadResult extends ActionResult {
  downloadUrl?: string;
}

export async function recordDownload(contentItemId: string): Promise<DownloadResult> {
  const item = await getContentById(contentItemId);
  if (!item) {
    return { success: false, message: 'Publication not found.' };
  }

  const permission = await checkViewerPermission(item, 'canDownload');
  if (!permission.ok) {
    return { success: false, message: permission.message };
  }

  const session = await getSession();
  const admin = createAdminClient();

  if (session) {
    const supabase = await createClient();
    const recorded = saved(
      await supabase
        .from('download_records')
        .insert({
          id: newId('dl'),
          user_id: session.user.id,
          content_item_id: item.id,
          content_title: item.title,
          version_number: item.versionNumber,
        })
        .select('id'),
      'Download recorded.',
      'Could not record the download. Try again.',
    );
    if (!recorded.success) return recorded;
  }

  const { error: countError } = await admin.rpc('increment_content_download_count', {
    item_id: item.id,
  });
  if (countError) {
    return { success: false, message: 'Could not record the download. Try again.' };
  }

  revalidatePath('/downloads');
  revalidatePath(`/catalogue/${item.slug}`);

  const versions = await getVersionsForContent(item.id);
  const latestVersion = versions[0];
  const storageBucket = latestVersion?.storageBucket ?? item.storageBucket;
  const storagePath = latestVersion?.storagePath ?? item.storagePath;
  if (!storageBucket || !storagePath) {
    return {
      success: true,
      message: 'Download recorded. No file has been uploaded for this publication yet.',
    };
  }

  const { data, error } = await admin.storage.from(storageBucket).createSignedUrl(storagePath, 60);
  if (error || !data) {
    return {
      success: true,
      message: 'Download recorded, but the file could not be retrieved. Try again shortly.',
    };
  }

  return {
    success: true,
    message: `Downloading ${latestVersion?.fileName ?? item.title}`,
    downloadUrl: data.signedUrl,
  };
}

export interface PreviewResult extends ActionResult {
  url?: string;
  fileFormat?: FileFormat;
  isExternalLink?: boolean;
}

export async function getPreviewUrl(contentItemId: string): Promise<PreviewResult> {
  const item = await getContentById(contentItemId);
  if (!item) {
    return { success: false, message: 'Publication not found.' };
  }

  const permission = await checkViewerPermission(item, 'canPreview');
  if (!permission.ok) {
    return { success: false, message: permission.message };
  }

  if (item.fileFormat === 'LINK') {
    if (!item.externalUrl) {
      return { success: false, message: 'No link has been set for this item yet.' };
    }
    return {
      success: true,
      message: '',
      url: item.externalUrl,
      fileFormat: item.fileFormat,
      isExternalLink: true,
    };
  }

  const versions = await getVersionsForContent(item.id);
  const latestVersion = versions[0];
  const storageBucket = latestVersion?.storageBucket ?? item.storageBucket;
  const storagePath = latestVersion?.storagePath ?? item.storagePath;
  if (!storageBucket || !storagePath) {
    return { success: false, message: 'No file has been uploaded for this publication yet.' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(storageBucket).createSignedUrl(storagePath, 300);
  if (error || !data) {
    return { success: false, message: 'The file could not be retrieved. Try again shortly.' };
  }

  return { success: true, message: '', url: data.signedUrl, fileFormat: item.fileFormat };
}

export async function createSubscription(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
  planCode: PlanCode,
  billingInterval: BillingInterval,
  paymentMethodType: PaymentMethodType,
  paymentReference?: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Sign in to subscribe.' };

  if (ownerType === 'USER' && ownerId !== session.user.id) {
    return { success: false, message: 'You can only create a subscription for your own account.' };
  }
  if (
    ownerType === 'INSTITUTION' &&
    (session.user.role !== 'INSTITUTION_ADMIN' || session.user.institutionId !== ownerId)
  ) {
    return {
      success: false,
      message: 'Only your institution administrator can start a subscription.',
    };
  }

  if (paymentMethodType === 'ORANGE_MONEY') {
    return beginOrangeMoneySubscription({
      ownerType,
      ownerId,
      planCode,
      billingInterval,
      phone: paymentReference ?? '',
    });
  }

  const existing = await getSubscriptionByOwner(ownerType, ownerId);
  if (existing)
    return { success: false, message: 'A subscription already exists for this account.' };

  const plan = await getPlanByCode(planCode);
  if (!plan) return { success: false, message: 'Plan not found.' };

  const now = new Date();
  const periodEnd = new Date(now);
  if (billingInterval === 'MONTHLY') periodEnd.setMonth(periodEnd.getMonth() + 1);
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  // subscriptions inserts are staff-only under RLS; self-service signup goes through the admin client.
  const admin = createAdminClient();
  const { error } = await admin.from('subscriptions').insert({
    id: newId('sub'),
    owner_type: ownerType,
    owner_id: ownerId,
    plan_id: plan.id,
    plan_code: plan.code,
    billing_interval: billingInterval,
    status: 'PENDING',
    payment_method_type: paymentMethodType,
    payment_reference: paymentReference ?? null,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  });
  if (error) return { success: false, message: 'Could not create subscription. Try again.' };

  revalidatePath('/billing');
  revalidatePath('/institution/billing');
  revalidatePath('/catalogue');

  return {
    success: true,
    message: 'Subscription created. It is pending payment setup before it becomes active.',
  };
}

export async function cancelSubscription(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
): Promise<ActionResult> {
  const subscription = await getSubscriptionByOwner(ownerType, ownerId);
  if (!subscription) return { success: false, message: 'Subscription not found.' };

  const supabase = await createClient();
  const result = saved(
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('id', subscription.id)
      .select('id'),
    'Subscription set to cancel at the end of the current billing period.',
    'Could not update the subscription.',
  );
  if (!result.success) return result;

  revalidatePath('/billing');
  revalidatePath('/institution/billing');
  return result;
}

export async function resumeSubscription(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
): Promise<ActionResult> {
  const subscription = await getSubscriptionByOwner(ownerType, ownerId);
  if (!subscription) return { success: false, message: 'Subscription not found.' };

  const supabase = await createClient();
  const result = saved(
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('id', subscription.id)
      .select('id'),
    'Subscription renewal resumed.',
    'Could not update the subscription.',
  );
  if (!result.success) return result;

  revalidatePath('/billing');
  revalidatePath('/institution/billing');
  return result;
}

export async function recordContentView(contentItemId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const item = await getContentById(contentItemId);
  if (!item || item.status !== 'PUBLISHED') return;

  const admin = createAdminClient();
  await admin.rpc('record_content_view', { item_id: item.id, viewer: session.user.id });
}

export async function changePlan(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
  planCode: PlanCode,
  billingInterval: BillingInterval,
): Promise<ActionResult> {
  const subscription = await getSubscriptionByOwner(ownerType, ownerId);
  if (!subscription) return { success: false, message: 'Subscription not found.' };

  const plan = await getPlanByCode(planCode);
  if (!plan) return { success: false, message: 'Plan not found.' };

  const supabase = await createClient();
  const result = saved(
    await supabase
      .from('subscriptions')
      .update({ plan_id: plan.id, plan_code: plan.code, billing_interval: billingInterval })
      .eq('id', subscription.id)
      .select('id'),
    `Plan changed to ${plan.name}, billed ${billingInterval === 'MONTHLY' ? 'monthly' : 'annually'}.`,
    'Could not update the subscription.',
  );
  if (!result.success) return result;

  revalidatePath('/billing');
  revalidatePath('/institution/billing');
  return result;
}
