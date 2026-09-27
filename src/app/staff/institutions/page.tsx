import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VerifyInstitutionButton } from '@/components/staff/verify-institution-button';
import { SubscriptionStatusBadge } from '@/components/shared/status-badges';
import { requireStaff } from '@/lib/auth';
import { getAllInstitutions, getMembersByInstitution } from '@/lib/mock-data/institutions';
import { getSubscriptionByOwner } from '@/lib/mock-data/subscriptions';
import { INSTITUTION_TYPE_LABELS, type Institution } from '@/lib/types';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Institution management' };

export default async function StaffInstitutionsPage() {
  await requireStaff();
  const institutions = await getAllInstitutions();
  const memberCounts = await Promise.all(
    institutions.map(async (institution) => {
      const members = await getMembersByInstitution(institution.id);
      return [institution.id, members.filter((m) => m.status !== 'REMOVED').length] as const;
    }),
  );
  const memberCountByInstitution = new Map(memberCounts);

  const subscriptionEntries = await Promise.all(
    institutions.map(
      async (institution) =>
        [institution.id, await getSubscriptionByOwner('INSTITUTION', institution.id)] as const,
    ),
  );
  const subscriptionByInstitution = new Map(subscriptionEntries);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Institution management"
        description="Registered institutions and their verification status."
      />
      <div className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institution</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutions.map((institution: Institution) => {
              const memberCount = memberCountByInstitution.get(institution.id) ?? 0;
              const subscription = subscriptionByInstitution.get(institution.id);
              return (
                <TableRow key={institution.id}>
                  <TableCell>
                    <p className="text-foreground font-medium">{institution.name}</p>
                    <p className="text-muted-foreground text-xs">{institution.country}</p>
                  </TableCell>
                  <TableCell>{INSTITUTION_TYPE_LABELS[institution.type]}</TableCell>
                  <TableCell>{memberCount}</TableCell>
                  <TableCell>
                    {subscription ? <SubscriptionStatusBadge status={subscription.status} /> : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(institution.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {institution.verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <VerifyInstitutionButton institutionId={institution.id} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
