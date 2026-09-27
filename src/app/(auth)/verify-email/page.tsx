import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { VerifyEmailActions } from '@/components/auth/verify-email-actions';
import { getSessionIncludingUnverified } from '@/lib/auth';
import { isVerificationOverdue } from '@/lib/auth/email-verification';
import { getAccountHomeHref } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'Confirm your email',
  description: 'Confirm your email address to keep using your account.',
};

export default async function VerifyEmailPage() {
  const session = await getSessionIncludingUnverified();
  if (!session) redirect('/sign-in');
  if (!isVerificationOverdue(session.user)) redirect(getAccountHomeHref(session.user.role));

  return (
    <AuthSplitLayout
      title="Confirm your email"
      description={`Your account is paused until you confirm ${session.user.email}. Open the link we emailed you, or send a new one.`}
    >
      <VerifyEmailActions />
    </AuthSplitLayout>
  );
}
