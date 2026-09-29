'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { confirmUserEmail } from '@/lib/mock-data/user-mutations';

export function ConfirmEmailButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await confirmUserEmail(userId);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      Confirm email
    </Button>
  );
}
