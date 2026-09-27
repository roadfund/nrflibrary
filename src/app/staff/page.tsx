import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatTile, StatTileGrid } from '@/components/shared/stat-tile';
import { ContentStatusBadge, AccessRequestStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { requireStaff } from '@/lib/auth';
import { getAllContentItems } from '@/lib/mock-data/content';
import { getAllAccessRequests } from '@/lib/mock-data/access-requests';
import { getAllSubscriptions } from '@/lib/mock-data/subscriptions';
import { getAuditLog } from '@/lib/mock-data/audit-log';
import { formatDateTime, formatNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Staff dashboard' };

export default async function StaffDashboardPage() {
  const { user } = await requireStaff();

  const [contentItems, accessRequests, subscriptions, auditLog] = await Promise.all([
    getAllContentItems(),
    getAllAccessRequests(),
    getAllSubscriptions(),
    getAuditLog(),
  ]);

  const published = contentItems.filter((item) => item.status === 'PUBLISHED').length;
  const needsAttention = contentItems.filter(
    (item) => item.status === 'IN_REVIEW' || item.status === 'CHANGES_REQUESTED',
  );
  const pendingRequests = accessRequests.filter(
    (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
  );
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const myItems = contentItems.filter((item) => item.ownerUserId === user.id);
  const recentAudit = auditLog.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="Staff dashboard"
      />

      <div className="mt-6">
        <StatTileGrid>
          <StatTile label="Published items" value={formatNumber(published)} />
          <StatTile
            label="Needs review"
            value={formatNumber(needsAttention.length)}
            hint="Drafts submitted or with changes requested"
          />
          <StatTile label="Pending access requests" value={formatNumber(pendingRequests.length)} />
          <StatTile label="Active subscriptions" value={formatNumber(activeSubscriptions)} />
        </StatTileGrid>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-serif text-lg font-semibold">Review queue</h2>
            <Link
              href="/staff/review"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {needsAttention.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">Nothing is waiting on review.</p>
          ) : (
            <div className="divide-border border-border mt-4 flex flex-col divide-y border-t">
              {needsAttention.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link
                    href={`/staff/library/${item.id}`}
                    className="text-foreground truncate hover:underline"
                  >
                    {item.title}
                  </Link>
                  <ContentStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-serif text-lg font-semibold">Access requests</h2>
            <Link
              href="/staff/requests"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              No requests waiting for a decision.
            </p>
          ) : (
            <div className="divide-border border-border mt-4 flex flex-col divide-y border-t">
              {pendingRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-foreground truncate">
                    {request.userName} · {request.contentTitle}
                  </span>
                  <AccessRequestStatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              My publishing activity
            </h2>
            <Button variant="outline" size="sm" render={<Link href="/staff/library/new" />}>
              New content
            </Button>
          </div>
          {myItems.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              You haven&apos;t created any content yet.
            </p>
          ) : (
            <div className="divide-border border-border mt-4 flex flex-col divide-y border-t">
              {myItems.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link
                    href={`/staff/library/${item.id}`}
                    className="text-foreground truncate hover:underline"
                  >
                    {item.title}
                  </Link>
                  <ContentStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              Recent audit activity
            </h2>
            <Link
              href="/staff/audit-log"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-border border-border mt-4 flex flex-col divide-y border-t">
            {recentAudit.map((entry) => (
              <div key={entry.id} className="py-3 text-sm">
                <p className="text-foreground">
                  <span className="font-medium">{entry.actorName}</span> {entry.detail}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
