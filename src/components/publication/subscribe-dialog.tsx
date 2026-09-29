'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSubscription } from '@/lib/mock-data/mutations';
import { refreshOrangeMoneyPayment } from '@/lib/payments/orange-money-actions';
import {
  phaseAfterPaymentCheck,
  phaseAfterSubscribeStart,
  type SubscribeDialogPhase,
} from '@/lib/payments/subscribe-phase';
import { formatCurrency } from '@/lib/format';
import type { BillingInterval, Plan } from '@/lib/types';

export function SubscribeDialog({
  ownerType,
  ownerId,
  plan,
  initialInterval = 'MONTHLY',
  triggerLabel = 'Subscribe',
  triggerClassName = 'w-full sm:w-auto',
  resumePending = false,
}: {
  ownerType: 'USER' | 'INSTITUTION';
  ownerId: string;
  plan: Plan;
  initialInterval?: BillingInterval;
  triggerLabel?: string;
  triggerClassName?: string;
  resumePending?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(initialInterval);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phase, setPhase] = useState<SubscribeDialogPhase>('form');
  const [statusMessage, setStatusMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const price = billingInterval === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;
  const period = billingInterval === 'MONTHLY' ? 'month' : 'year';
  const canSubmit = phoneNumber.trim().length >= 8;

  useEffect(() => {
    if (!open || phase !== 'pending') return;
    let stopped = false;

    async function poll() {
      const result = await refreshOrangeMoneyPayment(ownerType, ownerId);
      if (stopped) return;
      const next = phaseAfterPaymentCheck(result);
      setStatusMessage(next.message);
      if (next.phase !== 'pending') {
        setPhase(next.phase);
        if (next.phase === 'success') router.refresh();
      }
    }

    void poll();
    const timer = setInterval(() => void poll(), 4000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [open, ownerId, ownerType, phase, router]);

  function reset() {
    setPhase('form');
    setStatusMessage('');
    setBillingInterval(initialInterval);
  }

  function pay() {
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await createSubscription(
        ownerType,
        ownerId,
        plan.code,
        billingInterval,
        'ORANGE_MONEY',
        phoneNumber.trim(),
      );
      const next = phaseAfterSubscribeStart(result);
      setStatusMessage(next.message);
      setPhase(next.phase);
    });
  }

  function checkExistingPayment() {
    setStatusMessage('Checking the payment on your phone.');
    setPhase('pending');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button className={triggerClassName} />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {phase === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Subscribe</DialogTitle>
              <DialogDescription>
                You will get a prompt on your phone to approve the payment.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={billingInterval === 'MONTHLY' ? 'default' : 'outline'}
                  onClick={() => setBillingInterval('MONTHLY')}
                >
                  Monthly · {formatCurrency(plan.monthlyPrice, plan.currency)}
                </Button>
                <Button
                  type="button"
                  variant={billingInterval === 'ANNUAL' ? 'default' : 'outline'}
                  onClick={() => setBillingInterval('ANNUAL')}
                >
                  Annual · {formatCurrency(plan.annualPrice, plan.currency)}
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subscribe-phone">Mobile number</Label>
                <Input
                  id="subscribe-phone"
                  icon={Smartphone}
                  placeholder="0776 123 456"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                />
              </div>
              <p className="text-foreground text-sm">
                {plan.name} · {formatCurrency(price, plan.currency)} / {period}
              </p>
            </div>
            <DialogFooter className="sm:flex-col sm:items-stretch">
              <Button onClick={pay} disabled={!canSubmit} loading={isPending}>
                Pay {formatCurrency(price, plan.currency)}
              </Button>
              {resumePending ? (
                <Button type="button" variant="outline" onClick={checkExistingPayment}>
                  Check your phone
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : null}

        {phase === 'pending' ? (
          <>
            <DialogHeader>
              <DialogTitle>Payment pending</DialogTitle>
              <DialogDescription>Check your phone and approve the payment.</DialogDescription>
            </DialogHeader>
          </>
        ) : null}

        {phase === 'success' ? (
          <>
            <DialogHeader>
              <DialogTitle>Payment received</DialogTitle>
              <DialogDescription>Your subscription is active.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false);
                  reset();
                  router.refresh();
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {phase === 'error' ? (
          <>
            <DialogHeader>
              <DialogTitle>Payment failed</DialogTitle>
              <DialogDescription>
                {statusMessage || 'The payment did not go through. Try again.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setPhase('form');
                  setStatusMessage('');
                }}
              >
                Try again
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
