'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscribeDialog } from '@/components/publication/subscribe-dialog';
import { formatCurrency } from '@/lib/format';
import type { BillingInterval, Plan } from '@/lib/types';

export type PlanViewer =
  | { kind: 'ANONYMOUS' }
  | {
      kind: 'CAN_SUBSCRIBE';
      ownerType: 'USER' | 'INSTITUTION';
      ownerId: string;
      billingHref: string;
    }
  | { kind: 'SUBSCRIBED'; billingHref: string }
  | { kind: 'INSTITUTION_MEMBER' }
  | { kind: 'STAFF' };

function PlanAction({
  plan,
  interval,
  viewer,
}: {
  plan: Plan;
  interval: BillingInterval;
  viewer: PlanViewer;
}) {
  switch (viewer.kind) {
    case 'CAN_SUBSCRIBE':
      if (viewer.ownerType === 'USER' && plan.seatBased) {
        return (
          <p className="text-muted-foreground mt-6 text-center text-sm">
            This plan is for institution accounts.
          </p>
        );
      }
      return (
        <SubscribeDialog
          ownerType={viewer.ownerType}
          ownerId={viewer.ownerId}
          plan={plan}
          initialInterval={interval}
          triggerLabel="Subscribe"
          triggerClassName="mt-6 w-full"
        />
      );
    case 'SUBSCRIBED':
      return (
        <Button className="mt-6" variant="outline" render={<Link href={viewer.billingHref} />}>
          Manage subscription
        </Button>
      );
    case 'INSTITUTION_MEMBER':
      return (
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Your institution administrator manages the subscription.
        </p>
      );
    case 'STAFF':
      return (
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Staff accounts already have full access.
        </p>
      );
    default:
      return (
        <Button className="mt-6" render={<Link href="/create-account" />}>
          Get started
        </Button>
      );
  }
}

export function PlanComparison({
  plans,
  viewer = { kind: 'ANONYMOUS' },
}: {
  plans: Plan[];
  viewer?: PlanViewer;
}) {
  const [interval, setInterval] = useState<BillingInterval>('MONTHLY');

  return (
    <div>
      <div className="flex justify-center">
        <Tabs value={interval} onValueChange={(value) => setInterval(value as BillingInterval)}>
          <TabsList>
            <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
            <TabsTrigger value="ANNUAL">Annual</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        {plans.map((plan) => {
          const price = interval === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;
          const period = interval === 'MONTHLY' ? 'month' : 'year';

          return (
            <div
              key={plan.id}
              className="border-border mx-auto flex w-full max-w-sm flex-col rounded-md border p-6"
            >
              <h3 className="text-foreground font-serif text-lg font-semibold">{plan.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
              <p className="mt-4">
                <span className="text-foreground font-serif text-3xl font-semibold">
                  {formatCurrency(price, plan.currency)}
                </span>
                <span className="text-muted-foreground text-sm"> / {period}</span>
              </p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-foreground flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <PlanAction plan={plan} interval={interval} viewer={viewer} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
