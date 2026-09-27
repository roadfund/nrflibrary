'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/actions';
import { ResendVerificationButton } from './resend-verification-button';

export function VerifyEmailActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <ResendVerificationButton variant="default" className="h-11 w-full" />
      <Button
        type="button"
        variant="outline"
        loading={isPending}
        className="h-11 w-full"
        onClick={() =>
          startTransition(async () => {
            await signOut();
            router.push('/');
            router.refresh();
          })
        }
      >
        <LogOut />
        Sign out
      </Button>
    </div>
  );
}
