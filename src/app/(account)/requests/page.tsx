import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { AccountShell } from '@/components/layout/account-shell';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { AccessRequestStatusBadge } from '@/components/shared/status-badges';
import { requireAccountUser } from '@/lib/auth';
import { getAccessRequestsForUser } from '@/lib/mock-data/access-requests';
import { getContentByIds } from '@/lib/mock-data/content';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'My access requests' };

export default async function RequestsPage() {
  const { user } = await requireAccountUser();
  const requests = await getAccessRequestsForUser(user.id);
  const items = await getContentByIds(requests.map((request) => request.contentItemId));
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return (
    <AccountShell user={user}>
      <PageHeader
        title="My access requests"
        description="Requests you have submitted for restricted-access publications."
      />
      <div className="mt-6">
        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No access requests yet"
            description="Restricted publications are marked 'Request required.' Open one and submit a request to get started."
            action={
              <Button variant="outline" render={<Link href="/catalogue" />}>
                Browse the catalogue
              </Button>
            }
          />
        ) : (
          <div className="divide-border border-border flex flex-col divide-y border-t">
            {requests.map((request) => {
              const item = itemsById.get(request.contentItemId);
              return (
                <div key={request.id} className="flex flex-col gap-3 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {item ? (
                        <Link
                          href={`/catalogue/${item.slug}`}
                          className="text-foreground font-serif text-base font-semibold hover:underline"
                        >
                          {request.contentTitle}
                        </Link>
                      ) : (
                        <p className="text-foreground font-serif text-base font-semibold">
                          {request.contentTitle}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        Submitted {formatDate(request.submittedAt)}
                        {request.decidedAt ? ` · Decided ${formatDate(request.decidedAt)}` : ''}
                        {request.accessExpiresAt
                          ? ` · Access expires ${formatDate(request.accessExpiresAt)}`
                          : ''}
                      </p>
                    </div>
                    <AccessRequestStatusBadge status={request.status} />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    <span className="text-foreground font-medium">Purpose: </span>
                    {request.purpose}
                  </p>
                  {request.reviewNote ? (
                    <p className="border-border bg-muted/40 text-foreground rounded-md border p-3 text-sm">
                      <span className="font-medium">Reviewer note: </span>
                      {request.reviewNote}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountShell>
  );
}
