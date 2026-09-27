import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your National Road Fund Research Library account.',
};

export default async function ResetPasswordPage() {
  // Reached only after src/app/auth/confirm/route.ts exchanges the emailed
  // link's code for a recovery session. No session means an expired or
  // already-used link - send them back to request a new one.
  const session = await getSession();
  if (!session) redirect('/forgot-password');

  return (
    <AuthSplitLayout title="Choose a new password" description="Make it at least 8 characters.">
      <ResetPasswordForm />
    </AuthSplitLayout>
  );
}
