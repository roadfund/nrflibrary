import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { requireStaff } from '@/lib/auth';
import { getAuditLog } from '@/lib/mock-data/audit-log';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Audit log' };

export default async function AuditLogPage() {
  await requireStaff();
  const entries = await getAuditLog();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Audit log"
        description={`${entries.length} recorded actions, most recent first.`}
      />
      <div className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
                <TableCell>
                  <p className="text-foreground font-medium">{entry.actorName}</p>
                  <p className="text-muted-foreground text-xs">{entry.actorRole}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{entry.action.replaceAll('_', ' ').toLowerCase()}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {entry.targetLabel}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-sm truncate">
                  {entry.detail}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
