'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { removeInstitutionMember } from '@/lib/mock-data/institution-mutations';
import { formatDate } from '@/lib/format';
import type { InstitutionMember, InstitutionMemberStatus } from '@/lib/types/institution';

const STATUS_VARIANT: Record<InstitutionMemberStatus, 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  INVITED: 'secondary',
  REMOVED: 'destructive',
};

export function MemberTable({
  members,
  currentUserId,
}: {
  members: InstitutionMember[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Invited</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <p className="text-foreground font-medium">{member.name ?? member.email}</p>
              {member.name ? <p className="text-muted-foreground text-xs">{member.email}</p> : null}
            </TableCell>
            <TableCell>
              {member.role === 'INSTITUTION_ADMIN' ? 'Administrator' : 'Member'}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[member.status]}>{member.status}</Badge>
            </TableCell>
            <TableCell>{formatDate(member.invitedAt)}</TableCell>
            <TableCell className="text-right">
              {member.status !== 'REMOVED' && member.userId !== currentUserId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  loading={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeInstitutionMember(member.id);
                      if (result.success) toast.success(result.message);
                      else toast.error(result.message);
                    })
                  }
                >
                  Remove
                </Button>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
