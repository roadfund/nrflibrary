import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { InviteMemberForm } from '@/components/institution/invite-member-form';
import { MemberTable } from '@/components/institution/member-table';
import { requireInstitutionAdmin } from '@/lib/auth';
import { getInstitutionById, getMembersByInstitution } from '@/lib/mock-data/institutions';
import { getSubscriptionByOwner } from '@/lib/mock-data/subscriptions';

export const metadata: Metadata = { title: 'Member management' };

export default async function MembersPage() {
  const { user } = await requireInstitutionAdmin();
  const institution = user.institutionId ? await getInstitutionById(user.institutionId) : undefined;
  if (!institution) notFound();

  const members = await getMembersByInstitution(institution.id);
  const subscription = await getSubscriptionByOwner('INSTITUTION', institution.id);
  const activeCount = members.filter((m) => m.status !== 'REMOVED').length;

  return (
    <AccountShell user={user}>
      <PageHeader
        title="Member management"
        description={
          subscription?.seats
            ? `${activeCount} of ${subscription.seats} seats used.`
            : 'Invite colleagues to access content under your institution plan.'
        }
      />
      <div className="mt-6">
        <InviteMemberForm institutionId={institution.id} />
      </div>
      <div className="mt-8">
        <MemberTable members={members} currentUserId={user.id} />
      </div>
    </AccountShell>
  );
}
