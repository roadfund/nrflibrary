import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { AccessRequestStatusBadge } from '@/components/shared/status-badges';
import { AccessRequestDecisionDialog } from '@/components/staff/access-request-decision';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Inbox } from 'lucide-react';
import { requireStaff } from '@/lib/auth';
import { getAllAccessRequests } from '@/lib/mock-data/access-requests';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Access requests' };

export default async function StaffAccessRequestsPage() {
  await requireStaff();

  const accessRequests = await getAllAccessRequests();
  const sorted = [...accessRequests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const pending = sorted.filter((r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO');
  const decided = sorted.filter((r) => r.status === 'APPROVED' || r.status === 'DECLINED');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Access requests" description={`${pending.length} awaiting a decision.`} />

      <div className="mt-8">
        <h2 className="text-foreground font-serif text-lg font-semibold">Needs a decision</h2>
        <div className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No requests need a decision"
              description="New access requests will land here for you to review and approve or decline."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publication</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-foreground max-w-xs truncate font-medium">
                      {request.contentTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.userName} · {request.institution}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(request.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <AccessRequestStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AccessRequestDecisionDialog request={request} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-foreground font-serif text-lg font-semibold">Decided</h2>
        <div className="mt-4">
          {decided.length === 0 ? (
            <p className="text-muted-foreground text-sm">No decisions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publication</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Decided</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decided.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-foreground max-w-xs truncate font-medium">
                      {request.contentTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{request.userName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.decidedAt ? formatDate(request.decidedAt) : '—'}
                    </TableCell>
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
    </div>
  );
}
