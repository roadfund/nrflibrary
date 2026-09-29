import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { MetadataList } from '@/components/shared/metadata-list';
import { SubscriptionStatusBadge } from '@/components/shared/status-badges';
import { InvoiceTable } from '@/components/billing/invoice-table';
import { SubscriptionActions } from '@/components/billing/subscription-actions';
import { OrangePaymentNotice } from '@/components/billing/orange-payment-notice';
import { Button } from '@/components/ui/button';
import { requireIndividualSubscriber } from '@/lib/auth';
import { getSubscriptionByOwner, getInvoicesBySubscription } from '@/lib/mock-data/subscriptions';
import { getAllPlans, getPlanByCode } from '@/lib/mock-data/plans';
import { PAYMENT_METHOD_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Subscription & billing' };

export default async function BillingPage() {
  const { user } = await requireIndividualSubscriber();
  const subscription = await getSubscriptionByOwner('USER', user.id);
  const [invoices, plan, allPlans] = await Promise.all([
    subscription ? getInvoicesBySubscription(subscription.id) : Promise.resolve([]),
    subscription ? getPlanByCode(subscription.planCode) : Promise.resolve(undefined),
    getAllPlans(),
  ]);

  return (
    <AccountShell user={user}>
      <PageHeader title="Subscription & billing" />

      {!subscription ? (
        <div className="border-border bg-muted/40 mt-6 rounded-md border p-6">
          <p className="text-foreground text-sm font-medium">
            You don&apos;t have a subscription yet
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Subscribe to get full publication details and downloads.
          </p>
          <Button className="mt-4" render={<Link href="/pricing" />}>
            See plans
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-10">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-serif text-lg font-semibold">Current plan</h2>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
            <div className="mt-4">
              <MetadataList
                columns={3}
                items={[
                  { label: 'Plan', value: plan?.name ?? subscription.planCode },
                  {
                    label: 'Billing',
                    value: subscription.billingInterval === 'MONTHLY' ? 'Monthly' : 'Annual',
                  },
                  {
                    label: 'Payment method',
                    value: subscription.grantedBy
                      ? 'Granted by the National Road Fund'
                      : subscription.paymentMethodType
                        ? PAYMENT_METHOD_LABELS[subscription.paymentMethodType]
                        : '—',
                  },
                  ...(subscription.paymentReference
                    ? [{ label: 'Mobile money number', value: subscription.paymentReference }]
                    : []),
                  {
                    label: 'Current period',
                    value: `${formatDate(subscription.currentPeriodStart)} – ${formatDate(subscription.currentPeriodEnd)}`,
                  },
                  {
                    label: subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews',
                    value: formatDate(subscription.currentPeriodEnd),
                  },
                ]}
              />
            </div>
            {subscription.status === 'PENDING' &&
            subscription.paymentMethodType === 'ORANGE_MONEY' &&
            !subscription.grantedBy ? (
              <OrangePaymentNotice ownerType="USER" ownerId={user.id} />
            ) : null}
          </div>

          {subscription.grantedBy ? (
            <div>
              <h2 className="text-foreground font-serif text-lg font-semibold">Manage plan</h2>
              <p className="text-muted-foreground mt-4 max-w-xl text-sm">
                This access was granted by the National Road Fund and ends on{' '}
                {formatDate(subscription.currentPeriodEnd)}. Contact the Road Fund to extend it.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-foreground font-serif text-lg font-semibold">Manage plan</h2>
              <div className="mt-4 max-w-xl">
                <SubscriptionActions
                  ownerType="USER"
                  ownerId={user.id}
                  plans={allPlans.filter((p) => !p.seatBased)}
                  currentPlanCode={subscription.planCode}
                  currentInterval={subscription.billingInterval}
                  cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                />
              </div>
            </div>
          )}

          <div>
            <h2 className="text-foreground font-serif text-lg font-semibold">Invoice history</h2>
            <div className="mt-4">
              <InvoiceTable invoices={invoices} />
            </div>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
