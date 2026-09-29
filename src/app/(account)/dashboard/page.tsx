import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileSearch, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AccountShell } from '@/components/layout/account-shell';
import { EmailVerificationBanner } from '@/components/auth/email-verification-banner';
import { PageHeader } from '@/components/shared/page-header';
import { StatTile, StatTileGrid } from '@/components/shared/stat-tile';
import { EmptyState } from '@/components/shared/empty-state';
import { PublicationRow } from '@/components/publication/publication-row';
import {
  AccessRequestStatusBadge,
  SubscriptionStatusBadge,
} from '@/components/shared/status-badges';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { requireAccountUser } from '@/lib/auth';
import { isInstitutionRole } from '@/lib/types/roles';
import { getDownloadsForUser, getSavedItemsForUser } from '@/lib/mock-data/activity';
import { getAccessRequestsForUser } from '@/lib/mock-data/access-requests';
import { getInstitutionById, getMembersByInstitution } from '@/lib/mock-data/institutions';
import {
  getInstitutionUsage,
  getPublications,
  getViewerSubscription,
} from '@/lib/mock-data/queries';
import { getAllPlans } from '@/lib/mock-data/plans';
import { SubscribeDialog } from '@/components/publication/subscribe-dialog';
import { formatCurrency, formatDateShort, formatNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const { user } = await requireAccountUser();
  const isInstitution = isInstitutionRole(user.role);
  const institution =
    isInstitution && user.institutionId ? await getInstitutionById(user.institutionId) : undefined;
  const members = institution ? await getMembersByInstitution(institution.id) : [];

  const [
    { subscription, raw: subscriptionRecord },
    downloads,
    savedItems,
    accessRequests,
    recent,
    institutionUsage,
    plans,
  ] = await Promise.all([
    getViewerSubscription(
      isInstitution ? 'INSTITUTION' : 'USER',
      isInstitution ? (institution?.id ?? user.id) : user.id,
      user.id,
    ),
    Promise.resolve(getDownloadsForUser(user.id)),
    Promise.resolve(getSavedItemsForUser(user.id)),
    Promise.resolve(getAccessRequestsForUser(user.id)),
    getPublications({ sort: 'newest', pageSize: 4 }),
    institution ? getInstitutionUsage(institution.id) : Promise.resolve(null),
    getAllPlans(),
  ]);

  const pendingRequests = accessRequests.filter(
    (r) => r.status === 'PENDING' || r.status === 'NEEDS_INFO',
  );
  const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
  const memberCount = members.length;
  const subscribePlan = plans.find((item) =>
    isInstitution ? item.seatBased || item.code === 'STANDARD' : !item.seatBased,
  );
  const canPayHere =
    user.role !== 'INSTITUTION_MEMBER' &&
    Boolean(subscribePlan) &&
    !subscriptionRecord?.grantedBy &&
    (!subscriptionRecord || subscriptionRecord.status === 'PENDING');
  const subscribeOwnerId = isInstitution ? (institution?.id ?? user.id) : user.id;

  return (
    <AccountShell user={user}>
      <PageHeader
        title={institution ? institution.name : `Welcome back, ${user.name.split(' ')[0]}`}
        description={institution ? 'Institution dashboard' : undefined}
      />

      <EmailVerificationBanner user={user} />

      {canPayHere && subscribePlan ? (
        <div className="border-border mt-6 flex flex-col gap-3 rounded-md border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-foreground text-sm font-medium">
              {subscriptionRecord?.status === 'PENDING' ? 'Finish your subscription' : 'Subscribe'}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {subscriptionRecord?.status === 'PENDING'
                ? 'A payment is waiting. Check your phone, or send a new prompt.'
                : `${subscribePlan.name} is ${formatCurrency(subscribePlan.monthlyPrice, subscribePlan.currency)} a month.`}
            </p>
          </div>
          <SubscribeDialog
            ownerType={isInstitution ? 'INSTITUTION' : 'USER'}
            ownerId={subscribeOwnerId}
            plan={subscribePlan}
            triggerLabel={subscriptionRecord?.status === 'PENDING' ? 'Finish payment' : 'Subscribe'}
            triggerClassName="w-full sm:w-auto"
            resumePending={subscriptionRecord?.status === 'PENDING'}
          />
        </div>
      ) : null}

      {institution ? (
        institution.verified ? (
          <Alert variant="success" className="mt-6">
            <ShieldCheck />
            <AlertTitle>Institution verified</AlertTitle>
            <AlertDescription>Your institution is verified and in good standing.</AlertDescription>
          </Alert>
        ) : (
          <Alert className="mt-6">
            <ShieldAlert />
            <AlertTitle>Verification pending</AlertTitle>
            <AlertDescription>
              Road Fund staff are verifying your institution registration. Members can still be
              invited now and will gain access once verification and payment are complete.
            </AlertDescription>
          </Alert>
        )
      ) : null}

      <div className="mt-6">
        <StatTileGrid>
          <StatTile
            label="Subscription"
            value={subscription ? <SubscriptionStatusBadge status={subscription.status} /> : 'None'}
            hint={
              subscription
                ? subscription.planCode
                : 'Subscribe to get full publication details and downloads'
            }
          />
          {institution ? (
            <StatTile label="Active members" value={`${activeMembers} / ${memberCount}`} />
          ) : (
            <StatTile
              label="Downloads this period"
              value={
                subscription?.downloadLimitPerMonth
                  ? `${subscription.downloadsUsedThisPeriod} / ${subscription.downloadLimitPerMonth}`
                  : formatNumber(subscription?.downloadsUsedThisPeriod ?? 0)
              }
              hint={
                subscription?.downloadLimitPerMonth
                  ? 'Resets each billing period'
                  : 'No monthly limit'
              }
            />
          )}
          <StatTile label="Saved items" value={formatNumber(savedItems.length)} />
          <StatTile
            label="Access requests"
            value={formatNumber(pendingRequests.length)}
            hint="Awaiting a decision"
          />
        </StatTileGrid>
      </div>

      {institution ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {user.role === 'INSTITUTION_ADMIN' ? (
            <>
              <Button variant="outline" size="sm" render={<Link href="/institution/members" />}>
                Manage members
              </Button>
              <Button variant="outline" size="sm" render={<Link href="/institution/billing" />}>
                Institution billing
              </Button>
            </>
          ) : null}
          <Button variant="outline" size="sm" render={<Link href="/institution/usage" />}>
            Usage summary
          </Button>
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-serif text-lg font-semibold">Recent downloads</h2>
            <Link
              href="/downloads"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {downloads.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={FileSearch}
              title="No downloads yet"
              description="Publications you download will appear here."
            />
          ) : (
            <div className="divide-border border-border mt-4 flex flex-col divide-y border-t">
              {downloads.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-foreground">{record.contentTitle}</span>
                  <span className="text-muted-foreground shrink-0">
                    {formatDateShort(record.downloadedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-serif text-lg font-semibold">Access requests</h2>
            <Link
              href="/requests"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {accessRequests.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={FileSearch}
              title="No access requests"
              description="Requests you submit for restricted data will appear here."
            />
          ) : (
            <div className="divide-border border-border mt-4 flex flex-col divide-y border-t">
              {accessRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-foreground truncate">{request.contentTitle}</span>
                  <AccessRequestStatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {institutionUsage ? (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              Institution activity
            </h2>
            <Link
              href="/institution/activity"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4">
            <StatTileGrid>
              <StatTile
                label="Downloads (all time)"
                value={formatNumber(institutionUsage.totalDownloads)}
              />
              <StatTile
                label="Access requests (all time)"
                value={formatNumber(institutionUsage.totalAccessRequests)}
              />
            </StatTileGrid>
          </div>
        </div>
      ) : null}

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-serif text-lg font-semibold">Recently published</h2>
          <Button variant="outline" size="sm" render={<Link href="/catalogue" />}>
            Browse catalogue
          </Button>
        </div>
        <div className="mt-4">
          {recent.items.map((item) => (
            <PublicationRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </AccountShell>
  );
}
