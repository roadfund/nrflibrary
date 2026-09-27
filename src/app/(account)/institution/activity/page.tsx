import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { AccessRequestStatusBadge } from '@/components/shared/status-badges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Activity } from 'lucide-react';
import { requireInstitutionUser } from '@/lib/auth';
import { getInstitutionById } from '@/lib/mock-data/institutions';
import { getInstitutionUsage } from '@/lib/mock-data/queries';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Downloads & requests' };

export default async function InstitutionActivityPage() {
  const { user } = await requireInstitutionUser();
  const institution = user.institutionId ? await getInstitutionById(user.institutionId) : undefined;
  if (!institution) notFound();

  const usage = await getInstitutionUsage(institution.id);

  return (
    <AccountShell user={user}>
      <PageHeader
        title="Downloads & requests"
        description="Recent activity across your institution."
      />

      <div className="mt-6">
        <h2 className="text-foreground font-serif text-lg font-semibold">Recent downloads</h2>
        <div className="mt-4">
          {usage.recentDownloads.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No downloads yet"
              description="Downloads by anyone on your institution's account will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publication</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Downloaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.recentDownloads.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-foreground font-medium">
                      {record.contentTitle}
                    </TableCell>
                    <TableCell>v{record.versionNumber}</TableCell>
                    <TableCell>{formatDateTime(record.downloadedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-foreground font-serif text-lg font-semibold">Recent access requests</h2>
        <div className="mt-4">
          {usage.recentAccessRequests.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No access requests yet"
              description="Requests submitted by anyone on your institution's account will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publication</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.recentAccessRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-foreground font-medium">
                      {request.contentTitle}
                    </TableCell>
                    <TableCell>{request.userName}</TableCell>
                    <TableCell>
                      <AccessRequestStatusBadge status={request.status} />
                    </TableCell>
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
