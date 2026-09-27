'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { resendVerificationEmail } from '@/lib/auth/email-verification-actions';

export function ResendVerificationButton({
  className,
  variant = 'outline',
}: {
  className?: string;
  variant?: 'default' | 'outline';
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      loading={isPending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          const result = await resendVerificationEmail();
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      Resend confirmation email
    </Button>
  );
}
