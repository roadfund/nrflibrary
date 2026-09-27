import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { PlanComparison } from '@/components/billing/plan-comparison';
import { getAllPlans } from '@/lib/mock-data/plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'The National Road Fund Research Library subscription plans for students, researchers, and institutions.',
};

export default async function PricingPage() {
  const plans = await getAllPlans();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Subscription plans"
        description="Every plan includes catalogue search, subscriber-level downloads, and access-request eligibility. Prices are in US dollars."
      />
      <div className="mt-10">
        <PlanComparison plans={plans} />
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
