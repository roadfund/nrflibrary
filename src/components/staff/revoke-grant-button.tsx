'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { revokeSubscriptionGrant } from '@/lib/mock-data/subscription-grant-mutations';

export function RevokeGrantButton({ subscriptionId }: { subscriptionId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Revoke
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="destructive"
        size="sm"
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await revokeSubscriptionGrant(subscriptionId);
            if (result.success) toast.success(result.message);
            else toast.error(result.message);
            setConfirming(false);
          })
        }
      >
        Confirm revoke
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
