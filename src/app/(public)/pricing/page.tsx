import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { PlanComparison, type PlanViewer } from '@/components/billing/plan-comparison';
import { getSession } from '@/lib/auth';
import { getSubscriptionByOwner } from '@/lib/mock-data/subscriptions';
import { isStaffRole } from '@/lib/types/roles';
import { getAllPlans } from '@/lib/mock-data/plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'The National Road Fund Research Library subscription plans for students, researchers, and institutions.',
};

async function getPlanViewer(): Promise<PlanViewer> {
  const session = await getSession();
  if (!session) return { kind: 'ANONYMOUS' };
  const { user } = session;
  if (isStaffRole(user.role)) return { kind: 'STAFF' };
  if (user.role === 'INSTITUTION_MEMBER') return { kind: 'INSTITUTION_MEMBER' };

  const isInstitution = user.role === 'INSTITUTION_ADMIN' && user.institutionId;
  const ownerType = isInstitution ? 'INSTITUTION' : 'USER';
  const ownerId = isInstitution ? user.institutionId! : user.id;
  const billingHref = isInstitution ? '/institution/billing' : '/billing';

  const subscription = await getSubscriptionByOwner(ownerType, ownerId);
  if (subscription) return { kind: 'SUBSCRIBED', billingHref };
  return { kind: 'CAN_SUBSCRIBE', ownerType, ownerId, billingHref };
}

export default async function PricingPage() {
  const [plans, viewer] = await Promise.all([getAllPlans(), getPlanViewer()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Subscription plans"
        description="Every plan includes catalogue search, subscriber-level downloads, and access-request eligibility. Prices are in US dollars."
      />
      <div className="mt-10">
        <PlanComparison plans={plans} viewer={viewer} />
      </div>
      <div className="border-border text-muted-foreground mt-12 border-t pt-8 text-sm">
        <p>
          Payment is accepted by credit or debit card, mobile money, and Orange Money. Institution
          accounts use the same plan as individuals - the administrator manages members and billing
          from the institution dashboard.
        </p>
        <p className="mt-2">
          Have questions about a plan or an institutional agreement?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
