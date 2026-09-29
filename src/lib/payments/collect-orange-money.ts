import 'server-only';

import { revalidatePath } from 'next/cache';
import { newId } from '@/lib/ids';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanByCode } from '@/lib/mock-data/plans';
import { getSubscriptionByOwner } from '@/lib/mock-data/subscriptions';
import {
  applyOrangeSettlement,
  normalizeOrangeMsisdn,
  orangeAmount,
  orangeCurrency,
  orangeMoneyBaseUrl,
  queryOrangeCollectionStatus,
  quotedAmountMatches,
  startOrangeCollection,
  transactionOutcome,
} from '@/lib/payments/orange-money';
import type { BillingInterval, PlanCode } from '@/lib/types';

interface ActionResult {
  success: boolean;
  message: string;
  awaitingApproval?: boolean;
}

export interface OrangeSyncResult extends ActionResult {
  status: 'ACTIVE' | 'PENDING' | 'FAILED';
}

function periodEnd(start: Date, interval: BillingInterval): Date {
  const end = new Date(start);
  if (interval === 'MONTHLY') end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  return end;
}

function gatewayOptions():
  | { ok: true; baseUrl: string; apiKey: string }
  | { ok: false; message: string } {
  const apiKey = process.env.ORANGE_MONEY_API_KEY;
  if (!apiKey) {
    return { ok: false, message: 'Payment is not configured.' };
  }
  return { ok: true, baseUrl: orangeMoneyBaseUrl(), apiKey };
}

async function assertCanManage(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: 'Sign in to subscribe.' };
  if (ownerType === 'USER' && ownerId !== session.user.id) {
    return { ok: false, message: 'You can only create a subscription for your own account.' };
  }
  if (
    ownerType === 'INSTITUTION' &&
    (session.user.role !== 'INSTITUTION_ADMIN' || session.user.institutionId !== ownerId)
  ) {
    return {
      ok: false,
      message: 'Only your institution administrator can start a subscription.',
    };
  }
  return { ok: true };
}

export async function beginOrangeMoneySubscription(input: {
  ownerType: 'USER' | 'INSTITUTION';
  ownerId: string;
  planCode: PlanCode;
  billingInterval: BillingInterval;
  phone: string;
}): Promise<ActionResult> {
  const allowed = await assertCanManage(input.ownerType, input.ownerId);
  if (!allowed.ok) return { success: false, message: allowed.message };

  const msisdn = normalizeOrangeMsisdn(input.phone);
  if (!msisdn) {
    return {
      success: false,
      message: 'Enter a mobile number, for example 0776 123 456.',
    };
  }

  const plan = await getPlanByCode(input.planCode);
  if (!plan) return { success: false, message: 'Plan not found.' };
  const currency = orangeCurrency(plan.currency);
  if (!currency) {
    return { success: false, message: 'This plan is not billed in USD or Liberian dollars.' };
  }
  const price = Number(input.billingInterval === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice);
  const amount = orangeAmount(price);
  if (!amount) return { success: false, message: 'This plan does not have a collectable price.' };

  const gateway = gatewayOptions();
  if (!gateway.ok) return { success: false, message: gateway.message };

  const existing = await getSubscriptionByOwner(input.ownerType, input.ownerId);
  if (existing?.grantedBy || (existing && existing.status !== 'PENDING')) {
    return { success: false, message: 'A subscription already exists for this account.' };
  }

  const admin = createAdminClient();
  const now = new Date();
  const end = periodEnd(now, input.billingInterval);
  let subscriptionId = existing?.id;

  if (!subscriptionId) {
    subscriptionId = newId('sub');
    const { error } = await admin.from('subscriptions').insert({
      id: subscriptionId,
      owner_type: input.ownerType,
      owner_id: input.ownerId,
      plan_id: plan.id,
      plan_code: plan.code,
      billing_interval: input.billingInterval,
      status: 'PENDING',
      payment_method_type: 'ORANGE_MONEY',
      payment_reference: msisdn,
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
    });
    if (error) return { success: false, message: 'Could not start the payment. Try again.' };
  } else {
    const { error } = await admin
      .from('subscriptions')
      .update({
        plan_id: plan.id,
        plan_code: plan.code,
        billing_interval: input.billingInterval,
        payment_method_type: 'ORANGE_MONEY',
        payment_reference: msisdn,
      })
      .eq('id', subscriptionId)
      .eq('status', 'PENDING');
    if (error) return { success: false, message: 'Could not start the payment. Try again.' };
  }

  const { error: voidError } = await admin
    .from('invoices')
    .update({ status: 'VOID' })
    .eq('subscription_id', subscriptionId)
    .eq('status', 'OPEN');
  if (voidError) return { success: false, message: 'Could not start the payment. Try again.' };

  const invoiceId = newId('inv');
  const { error: invoiceError } = await admin.from('invoices').insert({
    id: invoiceId,
    subscription_id: subscriptionId,
    number: `RF-${invoiceId.slice(-8).toUpperCase()}`,
    amount: price,
    currency,
    status: 'OPEN',
    issued_at: now.toISOString(),
    period_start: now.toISOString(),
    period_end: end.toISOString(),
  });
  if (invoiceError) return { success: false, message: 'Could not start the payment. Try again.' };

  const started = await startOrangeCollection(
    { msisdn, currency, amount, externalId: invoiceId },
    gateway,
  );
  if (!started.ok) {
    await admin.from('invoices').update({ status: 'FAILED' }).eq('id', invoiceId);
    return { success: false, message: started.message };
  }

  const { error: txnError } = await admin
    .from('subscriptions')
    .update({ payment_txn_id: started.txnId })
    .eq('id', subscriptionId);
  if (txnError) {
    return {
      success: false,
      message: 'The payment timed out. Try again.',
    };
  }

  revalidatePath('/billing');
  revalidatePath('/institution/billing');
  return {
    success: true,
    awaitingApproval: true,
    message: 'Check your phone and approve the payment.',
  };
}

export async function syncStoredOrangePayment(subscriptionId: string): Promise<OrangeSyncResult> {
  const admin = createAdminClient();
  const { data: subscription, error } = await admin
    .from('subscriptions')
    .select(
      'id, status, plan_code, billing_interval, payment_method_type, payment_txn_id, granted_by',
    )
    .eq('id', subscriptionId)
    .maybeSingle();
  if (error || !subscription) {
    return { success: false, message: 'Subscription not found.', status: 'FAILED' };
  }
  if (subscription.granted_by) {
    return { success: false, message: 'This subscription was granted by staff.', status: 'FAILED' };
  }
  if (subscription.status === 'ACTIVE') {
    await admin
      .from('invoices')
      .update({ status: 'PAID', paid_at: new Date().toISOString() })
      .eq('subscription_id', subscription.id)
      .eq('status', 'OPEN');
    return { success: true, message: 'Subscription is active.', status: 'ACTIVE' };
  }
  if (subscription.payment_method_type !== 'ORANGE_MONEY' || !subscription.payment_txn_id) {
    return {
      success: false,
      message: 'No payment is waiting.',
      status: 'FAILED',
    };
  }

  const { data: invoice } = await admin
    .from('invoices')
    .select('id, amount, currency, status')
    .eq('subscription_id', subscription.id)
    .eq('status', 'OPEN')
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currency = orangeCurrency(invoice?.currency ?? '');
  if (!currency) {
    return {
      success: false,
      message: 'This invoice is not billed in USD or LRD.',
      status: 'FAILED',
    };
  }

  const gateway = gatewayOptions();
  if (!gateway.ok) {
    return { success: false, message: gateway.message, status: 'PENDING' };
  }

  const remote = await queryOrangeCollectionStatus(
    { txnId: subscription.payment_txn_id, currency },
    gateway,
  );
  if (!remote.ok) {
    return {
      success: true,
      message: 'Check your phone.',
      status: 'PENDING',
    };
  }

  const outcome = transactionOutcome(remote.status);
  const quoted = orangeAmount(Number(invoice?.amount ?? Number.NaN));
  if (outcome === 'PAID' && quoted && !quotedAmountMatches(quoted, remote.resultset)) {
    return {
      success: false,
      message: 'The amount charged does not match this invoice.',
      status: 'FAILED',
    };
  }

  const settlement = applyOrangeSettlement({
    subscriptionStatus: subscription.status,
    invoiceStatus: invoice?.status ?? 'OPEN',
    outcome,
  });

  if (!settlement.changed) {
    return {
      success: true,
      message:
        outcome === 'PENDING'
          ? 'Waiting for approval on your phone.'
          : 'Payment status is unchanged.',
      status: outcome === 'FAILED' ? 'FAILED' : outcome === 'PAID' ? 'ACTIVE' : 'PENDING',
    };
  }

  const now = new Date();
  if (settlement.subscriptionStatus === 'ACTIVE') {
    const end = periodEnd(now, subscription.billing_interval);
    const { data: activated, error: updateError } = await admin
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
      })
      .eq('id', subscription.id)
      .in('status', ['PENDING', 'PAST_DUE'])
      .select('id');
    if (updateError || !activated?.length) {
      const { data: current } = await admin
        .from('subscriptions')
        .select('status')
        .eq('id', subscription.id)
        .maybeSingle();
      if (current?.status === 'ACTIVE') {
        if (invoice) {
          await admin
            .from('invoices')
            .update({ status: 'PAID', paid_at: now.toISOString() })
            .eq('id', invoice.id)
            .eq('status', 'OPEN');
        }
        return { success: true, message: 'Subscription is active.', status: 'ACTIVE' };
      }
      return {
        success: false,
        message: 'Payment was received, but the subscription could not be updated.',
        status: 'PENDING',
      };
    }
  }

  if (invoice && settlement.invoiceStatus !== invoice.status) {
    await admin
      .from('invoices')
      .update(
        settlement.invoiceStatus === 'PAID'
          ? { status: 'PAID', paid_at: now.toISOString() }
          : { status: settlement.invoiceStatus },
      )
      .eq('id', invoice.id)
      .eq('status', 'OPEN');
  }

  revalidatePath('/billing');
  revalidatePath('/institution/billing');
  revalidatePath('/catalogue');

  if (settlement.subscriptionStatus === 'ACTIVE') {
    return {
      success: true,
      message: 'Payment received. Your subscription is active.',
      status: 'ACTIVE',
    };
  }
  return {
    success: false,
    message: 'Payment failed. Try again.',
    status: 'FAILED',
  };
}
