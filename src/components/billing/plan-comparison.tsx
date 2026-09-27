'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/format';
import type { BillingInterval, Plan } from '@/lib/types';

export function PlanComparison({ plans }: { plans: Plan[] }) {
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
              <Button className="mt-6" render={<Link href="/create-account" />}>
                Get started
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
