'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { changeUserRole } from '@/lib/mock-data/user-mutations';
import { ROLE_LABELS, ROLES, type Role } from '@/lib/types';

export function UserRoleControl({
  userId,
  currentRole,
  currentIsReviewer,
}: {
  userId: string;
  currentRole: Role;
  currentIsReviewer: boolean;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [isReviewer, setIsReviewer] = useState(currentIsReviewer);
  const [isPending, startTransition] = useTransition();

  const changed = role !== currentRole || isReviewer !== currentIsReviewer;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={role} onValueChange={(value) => setRole(value as Role)}>
        <SelectTrigger className="w-44" size="sm">
          <SelectValue>{(value: Role) => ROLE_LABELS[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role === 'PUBLISHER' ? (
        <div className="flex items-center gap-1.5">
          <Checkbox
            id={`reviewer-${userId}`}
            checked={isReviewer}
            onCheckedChange={() => setIsReviewer((v) => !v)}
          />
          <Label htmlFor={`reviewer-${userId}`} className="text-xs font-normal whitespace-nowrap">
            Reviewer
          </Label>
        </div>
      ) : null}
      {changed ? (
        <Button
          size="sm"
          loading={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await changeUserRole(userId, role, isReviewer);
              if (result.success) toast.success(result.message);
              else toast.error(result.message);
            })
          }
        >
          Save
        </Button>
      ) : null}
    </div>
  );
}
