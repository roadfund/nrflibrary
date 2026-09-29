'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { refreshOrangeMoneyPayment } from '@/lib/payments/orange-money-actions';

export function OrangePaymentNotice({
  ownerType,
  ownerId,
}: {
  ownerType: 'USER' | 'INSTITUTION';
  ownerId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border-border mt-4 max-w-xl rounded-md border p-4">
      <p className="text-foreground text-sm font-medium">Payment pending</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Check your phone and approve the prompt.
      </p>
      <Button
        className="mt-3"
        variant="outline"
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await refreshOrangeMoneyPayment(ownerType, ownerId);
            if (result.status === 'ACTIVE') {
              toast.success(result.message);
              router.refresh();
              return;
            }
            if (result.status === 'FAILED') toast.error(result.message);
            else toast.message(result.message);
          })
        }
      >
        Check payment
      </Button>
    </div>
  );
}
