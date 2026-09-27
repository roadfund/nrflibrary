import type { Metadata } from 'next';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset your National Road Fund Research Library password.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      title="Reset your password"
      description="Enter the email on your account and we'll send you a link to reset your password."
    >
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
