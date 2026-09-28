import { MailWarning } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getVerificationDeadline } from '@/lib/auth/email-verification';
import { formatDateShort } from '@/lib/format';
import type { User } from '@/lib/types';
import { ResendVerificationButton } from './resend-verification-button';

export function EmailVerificationBanner({ user }: { user: User }) {
  if (user.emailVerified) return null;

  return (
    <Alert variant="warning" className="mt-6">
      <MailWarning />
      <AlertTitle>Your email is not confirmed</AlertTitle>
      <AlertDescription>
        <p>
          We sent a confirmation link to {user.email}. Confirm it by{' '}
          {formatDateShort(getVerificationDeadline(user.createdAt).toISOString())} to keep access to
          your account.
        </p>
        <ResendVerificationButton className="mt-3" />
      </AlertDescription>
    </Alert>
  );
}
