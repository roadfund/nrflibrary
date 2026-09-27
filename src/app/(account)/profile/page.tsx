import type { Metadata } from 'next';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ProfileForm } from '@/components/auth/profile-form';
import { PasswordForm } from '@/components/auth/password-form';
import { requireIndividualSubscriber } from '@/lib/auth';

export const metadata: Metadata = { title: 'Profile & password' };

export default async function ProfilePage() {
  const { user } = await requireIndividualSubscriber();

  return (
    <AccountShell user={user}>
      <PageHeader title="Profile & password" />
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-foreground font-serif text-lg font-semibold">Profile</h2>
          <div className="mt-4 max-w-md">
            <ProfileForm
              email={user.email}
              defaultValues={{
                name: user.name,
                organization: user.organization ?? '',
                fieldOfStudy: user.fieldOfStudy ?? '',
              }}
            />
          </div>
        </div>
        <div>
          <h2 className="text-foreground font-serif text-lg font-semibold">Password</h2>
          <div className="mt-4 max-w-md">
            <PasswordForm />
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
