import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AccountShell } from '@/components/layout/account-shell';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { MetadataList } from '@/components/shared/metadata-list';
import { SubscriptionStatusBadge } from '@/components/shared/status-badges';
import { InvoiceTable } from '@/components/billing/invoice-table';
import { SubscriptionActions } from '@/components/billing/subscription-actions';
import { requireInstitutionAdmin } from '@/lib/auth';
import { getInstitutionById } from '@/lib/mock-data/institutions';
import { getSubscriptionByOwner, getInvoicesBySubscription } from '@/lib/mock-data/subscriptions';
import { getAllPlans, getPlanByCode } from '@/lib/mock-data/plans';
import { PAYMENT_METHOD_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Institution billing' };

export default async function InstitutionBillingPage() {
  const { user } = await requireInstitutionAdmin();
  const institution = user.institutionId ? await getInstitutionById(user.institutionId) : undefined;
  if (!institution) notFound();

  const subscription = await getSubscriptionByOwner('INSTITUTION', institution.id);
  const [invoices, plan, allPlans] = await Promise.all([
    subscription ? getInvoicesBySubscription(subscription.id) : Promise.resolve([]),
    subscription ? getPlanByCode(subscription.planCode) : Promise.resolve(undefined),
    getAllPlans(),
  ]);

  return (
    <AccountShell user={user}>
      <PageHeader title="Billing & subscription" />

      {!subscription ? (
        <div className="border-border bg-muted/40 mt-6 rounded-md border p-6">
          <p className="text-foreground text-sm font-medium">
            No subscription on file for this institution
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Subscribe to give your members full publication details and downloads.
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
                  ownerType="INSTITUTION"
                  ownerId={institution.id}
                  plans={allPlans}
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
