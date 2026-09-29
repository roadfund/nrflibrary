import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserRoleControl } from '@/components/staff/user-role-control';
import { AddStaffForm } from '@/components/staff/add-staff-form';
import { ConfirmEmailButton } from '@/components/staff/confirm-email-button';
import { requireStaff } from '@/lib/auth';
import { getAllProfiles } from '@/lib/mock-data/users';
import { ROLE_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'User management' };

export default async function UsersPage() {
  const { user: viewer } = await requireStaff();
  const isSuperAdmin = viewer.role === 'SUPER_ADMIN';
  const sorted = await getAllProfiles();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="User management"
        description={
          isSuperAdmin
            ? 'Assign roles and manage account status.'
            : 'Only a super admin can change roles or account status.'
        }
        actions={isSuperAdmin ? <AddStaffForm /> : null}
      />
      <div className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>{isSuperAdmin ? 'Role' : 'Role & status'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="text-foreground font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                  {!user.emailVerified ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="warning">Email not confirmed</Badge>
                      {isSuperAdmin ? <ConfirmEmailButton userId={user.id} /> : null}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  {isSuperAdmin ? (
                    <UserRoleControl
                      userId={user.id}
                      currentRole={user.role}
                      currentIsReviewer={user.isReviewer}
                      active={user.active}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                      {!user.active ? <Badge variant="destructive">Suspended</Badge> : null}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
