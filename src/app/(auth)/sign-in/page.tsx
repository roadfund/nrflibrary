import type { Metadata } from 'next';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { SignInForm } from '@/components/auth/sign-in-form';
import { InvalidLinkAlert } from '@/components/auth/invalid-link-alert';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the National Road Fund Research Library.',
};

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const { error } = await searchParams;
  return (
    <AuthSplitLayout
      title="Welcome back"
      description="Sign in to access your subscription, downloads, and access requests."
    >
      {error === 'invalid-link' ? (
        <InvalidLinkAlert>
          Email links work once and expire after a while. Sign in, and if your email still needs
          confirming, use the resend button on your dashboard.
        </InvalidLinkAlert>
      ) : null}
      <SignInForm />
    </AuthSplitLayout>
  );
}
