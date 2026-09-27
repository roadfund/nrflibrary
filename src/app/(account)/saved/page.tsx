import type { Metadata } from 'next';
import { Bookmark } from 'lucide-react';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PublicationRow } from '@/components/publication/publication-row';
import { requireAccountUser } from '@/lib/auth';
import { getSavedItemsForUser } from '@/lib/mock-data/activity';
import { getContentByIds } from '@/lib/mock-data/content';

export const metadata: Metadata = { title: 'Saved items' };

export default async function SavedItemsPage() {
  const { user } = await requireAccountUser();
  const saved = await getSavedItemsForUser(user.id);
  const items = await getContentByIds(saved.map((entry) => entry.contentItemId));

  return (
    <AccountShell user={user}>
      <PageHeader title="Saved items" description="Publications you have bookmarked for later." />
      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved items"
            description="Save a publication from its detail page to find it here."
          />
        ) : (
          <div className="border-border border-t">
            {items.map((item) => (
              <PublicationRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </AccountShell>
  );
}
