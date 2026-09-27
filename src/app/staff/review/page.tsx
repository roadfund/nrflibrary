import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { ContentStatusBadge } from '@/components/shared/status-badges';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck } from 'lucide-react';
import { requireStaff } from '@/lib/auth';
import { getAllContentItems } from '@/lib/mock-data/content';
import { formatDateTime } from '@/lib/format';
import type { ContentItem } from '@/lib/types';

export const metadata: Metadata = { title: 'Drafts & review queue' };

export default async function ReviewQueuePage() {
  await requireStaff();

  const contentItems = await getAllContentItems();
  const inReview = contentItems
    .filter((item) => item.status === 'IN_REVIEW')
    .sort((a, b) => (a.submittedForReviewAt ?? '').localeCompare(b.submittedForReviewAt ?? ''));
  const drafts = contentItems
    .filter((item) => item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Drafts & review queue" />
      <div className="mt-8">
        <Tabs defaultValue="review">
          <TabsList>
            <TabsTrigger value="review">In review ({inReview.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="review" className="mt-6">
            <ItemTable
              items={inReview}
              dateLabel="Submitted"
              dateField="submittedForReviewAt"
              emptyTitle="Nothing awaiting review"
              emptyDescription="Content submitted for review will land here for you to approve or send back."
            />
          </TabsContent>
          <TabsContent value="drafts" className="mt-6">
            <ItemTable
              items={drafts}
              dateLabel="Last updated"
              dateField="updatedAt"
              emptyTitle="No drafts in progress"
              emptyDescription="Unpublished and changes-requested content will show up here."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ItemTable({
  items,
  dateLabel,
  dateField,
  emptyTitle,
  emptyDescription,
}: {
  items: ContentItem[];
  dateLabel: string;
  dateField: 'submittedForReviewAt' | 'updatedAt';
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return <EmptyState icon={ClipboardCheck} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>{dateLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="max-w-sm truncate">
              <Link
                href={`/staff/library/${item.id}`}
                className="text-foreground font-medium hover:underline"
              >
                {item.title}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{item.ownerName}</TableCell>
            <TableCell>
              <ContentStatusBadge status={item.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item[dateField] ? formatDateTime(item[dateField] as string) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
