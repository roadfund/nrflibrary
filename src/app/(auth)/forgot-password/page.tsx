import type { Metadata } from 'next';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { InvalidLinkAlert } from '@/components/auth/invalid-link-alert';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset your National Road Fund Research Library password.',
};

export default async function ForgotPasswordPage({ searchParams }: PageProps<'/forgot-password'>) {
  const { error } = await searchParams;
  return (
    <AuthSplitLayout
      title="Reset your password"
      description="Enter the email on your account and we'll send you a link to reset your password."
    >
      {error === 'invalid-link' ? (
        <InvalidLinkAlert>Request a new reset link below.</InvalidLinkAlert>
      ) : null}
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
