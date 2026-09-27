import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { SettingsForm } from '@/components/staff/settings-form';
import { requireStaff } from '@/lib/auth';
import { getPlatformSettings } from '@/lib/mock-data/settings';

export const metadata: Metadata = { title: 'Platform settings' };

export default async function SettingsPage() {
  const { user } = await requireStaff();
  const platformSettings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Platform settings"
        description={
          user.role === 'SUPER_ADMIN' ? undefined : 'Only a super admin can change these settings.'
        }
      />
      <div className="mt-8">
        {user.role === 'SUPER_ADMIN' ? (
          <SettingsForm defaultValues={platformSettings} />
        ) : (
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Maximum upload size</dt>
              <dd className="text-foreground mt-1">{platformSettings.maxUploadSizeMb} MB</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Default access request period</dt>
              <dd className="text-foreground mt-1">
                {platformSettings.defaultAccessRequestDays} days
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Support email</dt>
              <dd className="text-foreground mt-1">{platformSettings.supportEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Institution verification</dt>
              <dd className="text-foreground mt-1">
                {platformSettings.requireInstitutionVerification ? 'Required' : 'Not required'}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
