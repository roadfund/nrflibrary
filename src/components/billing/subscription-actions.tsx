'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cancelSubscription, changePlan, resumeSubscription } from '@/lib/mock-data/mutations';
import type { BillingInterval, Plan, PlanCode } from '@/lib/types';

export function SubscriptionActions({
  ownerType,
  ownerId,
  plans,
  currentPlanCode,
  currentInterval,
  cancelAtPeriodEnd,
}: {
  ownerType: 'USER' | 'INSTITUTION';
  ownerId: string;
  plans: Plan[];
  currentPlanCode: PlanCode;
  currentInterval: BillingInterval;
  cancelAtPeriodEnd: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [planCode, setPlanCode] = useState<PlanCode>(currentPlanCode);
  const [interval, setInterval] = useState<BillingInterval>(currentInterval);

  const planChanged = planCode !== currentPlanCode || interval !== currentInterval;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
            Plan
          </p>
          <Select value={planCode} onValueChange={(value) => setPlanCode(value as PlanCode)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: PlanCode) => plans.find((plan) => plan.code === value)?.name ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.code} value={plan.code}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
            Billing
          </p>
          <Select value={interval} onValueChange={(value) => setInterval(value as BillingInterval)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: BillingInterval) => (value === 'ANNUAL' ? 'Annual' : 'Monthly')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="ANNUAL">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          disabled={!planChanged}
          loading={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await changePlan(ownerType, ownerId, planCode, interval);
              if (result.success) toast.success(result.message);
              else toast.error(result.message);
            })
          }
        >
          Update plan
        </Button>
      </div>

      <div>
        {cancelAtPeriodEnd ? (
          <Button
            variant="outline"
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await resumeSubscription(ownerType, ownerId);
                if (result.success) toast.success(result.message);
                else toast.error(result.message);
              })
            }
          >
            Resume subscription
          </Button>
        ) : (
          <Button
            variant="outline"
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await cancelSubscription(ownerType, ownerId);
                if (result.success) toast.success(result.message);
                else toast.error(result.message);
              })
            }
          >
            Cancel subscription
          </Button>
        )}
      </div>
    </div>
  );
}
