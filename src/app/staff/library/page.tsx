import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, FileX2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LibraryFilters } from '@/components/staff/library-filters';
import {
  ContentStatusBadge,
  AccessLevelBadge,
  ContentTypeBadge,
} from '@/components/shared/status-badges';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { requireStaff } from '@/lib/auth';
import { getContentLibrary } from '@/lib/mock-data/queries';
import { formatDateShort, formatNumber } from '@/lib/format';
import type { ContentStatus, ContentType } from '@/lib/types';

export const metadata: Metadata = { title: 'Content library' };

export default async function ContentLibraryPage({ searchParams }: PageProps<'/staff/library'>) {
  await requireStaff();
  const resolved = await searchParams;
  const q = typeof resolved.q === 'string' ? resolved.q : undefined;
  const status =
    typeof resolved.status === 'string' ? (resolved.status as ContentStatus) : undefined;
  const contentType =
    typeof resolved.contentType === 'string' ? (resolved.contentType as ContentType) : undefined;

  const result = await getContentLibrary({
    q,
    status: status ? [status] : undefined,
    contentType: contentType ? [contentType] : undefined,
    sort: 'newest',
    pageSize: 100,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Content library"
        description={`${result.total} item${result.total === 1 ? '' : 's'} across every status and access level.`}
        actions={
          <Button render={<Link href="/staff/library/new" />}>
            <Plus className="size-4" />
            New content
          </Button>
        }
      />
      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <LibraryFilters />
        </Suspense>
      </div>
      <div className="mt-6">
        {result.items.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title="No matching content"
            description="Nothing in the library matches this search or filter combination. Try clearing one of them."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-xs truncate">
                    <Link
                      href={`/staff/library/${item.id}`}
                      className="text-foreground font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ContentTypeBadge type={item.contentType} />
                  </TableCell>
                  <TableCell>
                    <ContentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <AccessLevelBadge level={item.accessLevel} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.ownerName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateShort(item.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(item.downloadCount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
