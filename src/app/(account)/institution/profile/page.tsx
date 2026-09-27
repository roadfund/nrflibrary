import type { Metadata } from 'next';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { InstitutionProfileForm } from '@/components/institution/institution-profile-form';
import { requireInstitutionAdmin } from '@/lib/auth';
import { getInstitutionById } from '@/lib/mock-data/institutions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'Institution profile' };

export default async function InstitutionProfilePage() {
  const { user } = await requireInstitutionAdmin();
  const institution = user.institutionId ? await getInstitutionById(user.institutionId) : undefined;
  if (!institution) notFound();

  return (
    <AccountShell user={user}>
      <PageHeader
        title="Institution profile"
        description="Visible to Road Fund staff during verification."
      />
      <div className="mt-6 max-w-xl">
        <InstitutionProfileForm
          defaultValues={{
            institutionId: institution.id,
            name: institution.name,
            type: institution.type,
            country: institution.country,
            website: institution.website ?? '',
          }}
        />
      </div>
    </AccountShell>
  );
}
