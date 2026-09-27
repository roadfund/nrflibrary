import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { PlanEditDialog } from '@/components/staff/plan-edit-dialog';
import { requireStaff } from '@/lib/auth';
import { getAllPlans } from '@/lib/mock-data/plans';
import { formatCurrency, pluralize } from '@/lib/format';

export const metadata: Metadata = { title: 'Subscription plans' };

export default async function StaffPlansPage() {
  const { user } = await requireStaff();
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const plans = await getAllPlans();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Subscription plans"
        description={
          isSuperAdmin
            ? 'Prices shown to subscribers on the pricing page.'
            : 'Only a super admin can edit plan pricing.'
        }
      />
      <div className="divide-border border-border mt-8 flex flex-col divide-y border-t">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-foreground font-serif text-base font-semibold">{plan.name}</p>
                {!plan.active ? <Badge variant="outline">Inactive</Badge> : null}
                {plan.seatBased ? <Badge variant="secondary">Seat-based</Badge> : null}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
              <p className="text-foreground mt-2 text-sm">
                {formatCurrency(plan.monthlyPrice, plan.currency)}
                {plan.seatBased ? ' / seat' : ''} / month ·{' '}
                {formatCurrency(plan.annualPrice, plan.currency)}
                {plan.seatBased ? ' / seat' : ''} / year
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {plan.downloadLimitPerMonth
                  ? `${plan.downloadLimitPerMonth} ${pluralize(plan.downloadLimitPerMonth, 'download')} / month`
                  : 'No monthly download limit'}
              </p>
            </div>
            {isSuperAdmin ? <PlanEditDialog plan={plan} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
