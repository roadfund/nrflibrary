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
import { UserActionsMenu } from '@/components/staff/user-actions-menu';
import { AddStaffForm } from '@/components/staff/add-staff-form';
import { ConfirmEmailButton } from '@/components/staff/confirm-email-button';
import { requireStaff } from '@/lib/auth';
import { getAllProfiles, getContentOwnerIds } from '@/lib/mock-data/users';
import { ROLE_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'User management' };

export default async function UsersPage() {
  const { user: viewer } = await requireStaff();
  const isSuperAdmin = viewer.role === 'SUPER_ADMIN';
  const [sorted, contentOwnerIds] = await Promise.all([getAllProfiles(), getContentOwnerIds()]);
  const staffOptions = sorted
    .filter((user) => user.active && (user.role === 'SUPER_ADMIN' || user.role === 'PUBLISHER'))
    .map((user) => ({ id: user.id, name: user.name }));

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
              {isSuperAdmin ? (
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="text-foreground font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                  {isSuperAdmin && !user.active ? (
                    <Badge variant="destructive" className="mt-1.5">
                      Suspended
                    </Badge>
                  ) : null}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                    {user.role === 'PUBLISHER' && user.isReviewer ? (
                      <Badge variant="secondary">Reviewer</Badge>
                    ) : null}
                    {!isSuperAdmin && !user.active ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : null}
                  </div>
                </TableCell>
                {isSuperAdmin ? (
                  <TableCell className="text-right">
                    <UserActionsMenu
                      userId={user.id}
                      name={user.name}
                      email={user.email}
                      role={user.role}
                      isReviewer={user.isReviewer}
                      active={user.active}
                      isSelf={user.id === viewer.id}
                      ownsContent={contentOwnerIds.has(user.id)}
                      staffOptions={staffOptions.filter((option) => option.id !== user.id)}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
