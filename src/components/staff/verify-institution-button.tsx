'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { verifyInstitution } from '@/lib/mock-data/user-mutations';

export function VerifyInstitutionButton({ institutionId }: { institutionId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await verifyInstitution(institutionId);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      Verify
    </Button>
  );
}
