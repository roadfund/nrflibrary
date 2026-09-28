import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GrantSubscriptionDialog,
  type GrantRecipient,
} from '@/components/staff/grant-subscription-dialog';
import { RevokeGrantButton } from '@/components/staff/revoke-grant-button';
import { requireStaff } from '@/lib/auth';
import { getAllProfiles } from '@/lib/mock-data/users';
import { getAllInstitutions } from '@/lib/mock-data/institutions';
import { getGrantedSubscriptions } from '@/lib/mock-data/subscriptions';
import { GRANT_CATEGORY_LABELS } from '@/lib/types/plan';
import { INDIVIDUAL_SUBSCRIBER_ROLES } from '@/lib/types/roles';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Granted access' };

export default async function GrantedSubscriptionsPage() {
  const { user: viewer } = await requireStaff();
  const isSuperAdmin = viewer.role === 'SUPER_ADMIN';

  const [grants, profiles, institutions] = await Promise.all([
    getGrantedSubscriptions(),
    getAllProfiles(),
    getAllInstitutions(),
  ]);

  const users: GrantRecipient[] = profiles
    .filter((p) => INDIVIDUAL_SUBSCRIBER_ROLES.includes(p.role))
    .map((p) => ({ id: p.id, name: p.name, detail: p.email }));
  const institutionRecipients: GrantRecipient[] = institutions.map((i) => ({
    id: i.id,
    name: i.name,
    detail: i.country,
  }));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const institutionById = new Map(institutions.map((i) => [i.id, i]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Granted access"
        description={
          isSuperAdmin
            ? 'Give partners, students, and others a subscription without payment.'
            : 'Subscriptions granted without payment. Only a super admin can grant or revoke them.'
        }
        actions={
          isSuperAdmin ? (
            <GrantSubscriptionDialog users={users} institutions={institutionRecipients} />
          ) : null
        }
      />
      <div className="mt-8">
        {grants.length === 0 ? (
          <EmptyState
            title="No granted subscriptions yet"
            description={
              isSuperAdmin
                ? 'Use “Grant subscription” to give someone access.'
                : 'A super admin can grant subscriptions from this page.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Access until</TableHead>
                <TableHead>Granted by</TableHead>
                {isSuperAdmin ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {grants.map((grant) => {
                const owner =
                  grant.ownerType === 'USER'
                    ? profileById.get(grant.ownerId)
                    : institutionById.get(grant.ownerId);
                const ownerDetail =
                  grant.ownerType === 'USER'
                    ? (profileById.get(grant.ownerId)?.email ?? '')
                    : `Institution · ${grant.seats ?? 0} seats`;
                const granter = grant.grantedBy ? profileById.get(grant.grantedBy) : undefined;
                const isActive = grant.status === 'ACTIVE';
                return (
                  <TableRow key={grant.id}>
                    <TableCell>
                      <p className="text-foreground font-medium">{owner?.name ?? 'Unknown'}</p>
                      <p className="text-muted-foreground text-xs">{ownerDetail}</p>
                      {grant.grantNote ? (
                        <p className="text-muted-foreground mt-1 max-w-xs text-xs italic">
                          {grant.grantNote}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {grant.grantCategory ? (
                        <Badge variant="outline">
                          {GRANT_CATEGORY_LABELS[grant.grantCategory]}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p className="text-foreground">{formatDate(grant.currentPeriodEnd)}</p>
                      {isActive ? (
                        <Badge variant="success" className="mt-1">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="mt-1">
                          {grant.status === 'CANCELED' ? 'Revoked' : 'Expired'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{granter?.name ?? '—'}</TableCell>
                    {isSuperAdmin ? (
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {owner ? (
                            <GrantSubscriptionDialog
                              users={users}
                              institutions={institutionRecipients}
                              triggerLabel={isActive ? 'Extend' : 'Renew'}
                              triggerVariant="outline"
                              initial={{
                                ownerType: grant.ownerType,
                                ownerId: grant.ownerId,
                                category: grant.grantCategory ?? 'OTHER',
                                note: grant.grantNote,
                                seats: grant.seats,
                              }}
                            />
                          ) : null}
                          {isActive ? <RevokeGrantButton subscriptionId={grant.id} /> : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
