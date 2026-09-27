import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatTile, StatTileGrid } from '@/components/shared/stat-tile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { BarChart3 } from 'lucide-react';
import { requireInstitutionUser } from '@/lib/auth';
import { getInstitutionById } from '@/lib/mock-data/institutions';
import { getInstitutionUsage } from '@/lib/mock-data/queries';
import { formatNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Usage summary' };

export default async function UsagePage() {
  const { user } = await requireInstitutionUser();
  const institution = user.institutionId ? await getInstitutionById(user.institutionId) : undefined;
  if (!institution) notFound();

  const usage = await getInstitutionUsage(institution.id);
  const sortedMembers = [...usage.byMember].sort((a, b) => b.downloads - a.downloads);

  return (
    <AccountShell user={user}>
      <PageHeader
        title="Usage summary"
        description="Activity across all members of your institution."
      />

      <div className="mt-6">
        <StatTileGrid>
          <StatTile label="Total downloads" value={formatNumber(usage.totalDownloads)} />
          <StatTile label="Total access requests" value={formatNumber(usage.totalAccessRequests)} />
          <StatTile label="Active members" value={formatNumber(usage.byMember.length)} />
        </StatTileGrid>
      </div>

      <div className="mt-10">
        <h2 className="text-foreground font-serif text-lg font-semibold">Downloads by member</h2>
        <div className="mt-4">
          {sortedMembers.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No activity yet"
              description="Once a member downloads a publication, their activity will show up here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="text-foreground font-medium">{member.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(member.downloads)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
