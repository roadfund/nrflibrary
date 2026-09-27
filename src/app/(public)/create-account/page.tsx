import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CreateAccountWizard } from '@/components/auth/create-account-wizard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a National Road Fund Research Library account.',
};

export default function CreateAccountPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="border-border rounded-xl border p-6 sm:p-8">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <CreateAccountWizard />
        </Suspense>
      </div>
    </div>
  );
}
