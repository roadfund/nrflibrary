import type { Metadata } from 'next';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the National Road Fund Research Library.',
};

export default function SignInPage() {
  return (
    <AuthSplitLayout
      title="Welcome back"
      description="Sign in to access your subscription, downloads, and access requests."
    >
      <SignInForm />
    </AuthSplitLayout>
  );
}
