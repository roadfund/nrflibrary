'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { CreditCard, Smartphone } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createSubscription } from '@/lib/mock-data/mutations';
import { formatCurrency } from '@/lib/format';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_TYPES } from '@/lib/types';
import type { BillingInterval, Plan, PaymentMethodType } from '@/lib/types';

const PAYMENT_METHOD_LOGOS: Partial<Record<PaymentMethodType, string>> = {
  MOBILE_MONEY: '/momo.png',
  ORANGE_MONEY: '/orangemoney.png',
};

function PaymentMethodIcon({ method }: { method: PaymentMethodType }) {
  const logo = PAYMENT_METHOD_LOGOS[method];
  if (logo) {
    return <Image src={logo} alt="" width={20} height={20} className="rounded-sm object-contain" />;
  }
  return <CreditCard className="text-muted-foreground size-4" />;
}

const MOBILE_METHODS: PaymentMethodType[] = ['MOBILE_MONEY', 'ORANGE_MONEY'];

export function SubscribeDialog({
  ownerType,
  ownerId,
  plan,
  initialInterval = 'MONTHLY',
  triggerLabel = 'Subscribe',
  triggerClassName = 'w-full sm:w-auto',
  redirectTo,
}: {
  ownerType: 'USER' | 'INSTITUTION';
  ownerId: string;
  plan: Plan;
  initialInterval?: BillingInterval;
  triggerLabel?: string;
  triggerClassName?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPending, startTransition] = useTransition();

  const price = interval === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;
  const period = interval === 'MONTHLY' ? 'month' : 'year';
  const needsPhoneNumber = paymentMethod !== '' && MOBILE_METHODS.includes(paymentMethod);
  const canSubmit = paymentMethod !== '' && (!needsPhoneNumber || phoneNumber.trim().length >= 8);

  function onSubmit() {
    if (!canSubmit) return;
    const method = paymentMethod as PaymentMethodType;
    startTransition(async () => {
      const result = await createSubscription(
        ownerType,
        ownerId,
        plan.code,
        interval,
        method,
        needsPhoneNumber ? phoneNumber.trim() : undefined,
      );
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setInterval(initialInterval);
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button className={triggerClassName} />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {plan.name}</DialogTitle>
          <DialogDescription>{plan.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Billing</Label>
              <Select
                value={interval}
                onValueChange={(value) => setInterval(value as BillingInterval)}
              >
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

            <div className="flex flex-col gap-1.5">
              <Label>Payment method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethodType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select">
                    {(value: PaymentMethodType | null) =>
                      value ? PAYMENT_METHOD_LABELS[value] : 'Select'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_TYPES.map((method) => (
                    <SelectItem key={method} value={method}>
                      <PaymentMethodIcon method={method} />
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsPhoneNumber ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subscribe-phone">Mobile money number</Label>
              <Input
                id="subscribe-phone"
                icon={Smartphone}
                placeholder="0776 123 456"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </div>
          ) : null}

          <div className="bg-muted/40 rounded-lg p-4">
            <div className="text-foreground flex items-center justify-between text-sm">
              <span>
                {plan.name} · {interval === 'MONTHLY' ? 'monthly' : 'annually'}
              </span>
              <span>{formatCurrency(price, plan.currency)}</span>
            </div>
            <div className="border-border mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-foreground text-sm font-semibold">Total</span>
              <span className="text-primary font-serif text-xl font-semibold">
                {formatCurrency(price, plan.currency)}
                <span className="text-muted-foreground text-sm font-normal"> / {period}</span>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={!canSubmit} loading={isPending}>
            Subscribe - {formatCurrency(price, plan.currency)}/{period}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
