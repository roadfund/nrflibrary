import { createClient } from '@/lib/supabase/server';
import type { Invoice, Subscription } from '@/lib/types';

function toSubscription(row: {
  id: string;
  owner_type: Subscription['ownerType'];
  owner_id: string;
  plan_id: string;
  plan_code: Subscription['planCode'];
  billing_interval: Subscription['billingInterval'];
  status: Subscription['status'];
  seats: number | null;
  seats_used: number | null;
  payment_method_type: Subscription['paymentMethodType'];
  payment_reference: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}): Subscription {
  return {
    id: row.id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    planId: row.plan_id,
    planCode: row.plan_code,
    billingInterval: row.billing_interval,
    status: row.status,
    seats: row.seats,
    seatsUsed: row.seats_used,
    paymentMethodType: row.payment_method_type,
    paymentReference: row.payment_reference,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    createdAt: row.created_at,
  };
}

function toInvoice(row: {
  id: string;
  subscription_id: string;
  number: string;
  amount: number;
  currency: string;
  status: Invoice['status'];
  issued_at: string;
  paid_at: string | null;
  period_start: string;
  period_end: string;
}): Invoice {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    number: row.number,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    issuedAt: row.issued_at,
    paidAt: row.paid_at,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  };
}

export async function getSubscriptionByOwner(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
): Promise<Subscription | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .maybeSingle();
  return data ? toSubscription(data) : undefined;
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('subscriptions').select('*');
  return (data ?? []).map(toSubscription);
}

export async function getInvoicesBySubscription(subscriptionId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('issued_at', { ascending: false });
  return (data ?? []).map(toInvoice);
}
