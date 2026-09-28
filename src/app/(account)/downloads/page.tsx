import type { Metadata } from 'next';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAccountUser } from '@/lib/auth';
import { getDownloadsForUser } from '@/lib/mock-data/activity';
import { getContentByIds } from '@/lib/mock-data/content';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'My downloads' };

export default async function DownloadsPage() {
  const { user } = await requireAccountUser();
  const downloads = await getDownloadsForUser(user.id);
  const items = await getContentByIds(
    downloads.flatMap((record) => (record.contentItemId ? [record.contentItemId] : [])),
  );
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return (
    <AccountShell user={user}>
      <PageHeader
        title="My downloads"
        description="Every file you have downloaded from the Research Hub."
      />
      <div className="mt-6">
        {downloads.length === 0 ? (
          <EmptyState
            icon={Download}
            title="No downloads yet"
            description="Every file you download will be listed here with the version you received, so you can always find it again."
            action={
              <Button variant="outline" render={<Link href="/catalogue" />}>
                Browse the catalogue
              </Button>
            }
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
              {downloads.map((record) => {
                const item = record.contentItemId ? itemsById.get(record.contentItemId) : undefined;
                return (
                  <TableRow key={record.id}>
                    <TableCell className="text-foreground font-medium">
                      {item ? (
                        <Link href={`/catalogue/${item.slug}`} className="hover:underline">
                          {record.contentTitle}
                        </Link>
                      ) : (
                        record.contentTitle
                      )}
                    </TableCell>
                    <TableCell>v{record.versionNumber}</TableCell>
                    <TableCell>{formatDateTime(record.downloadedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </AccountShell>
  );
}
