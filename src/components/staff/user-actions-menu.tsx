'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Mail, MoreHorizontal, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteUser, toggleUserActive, updateUser } from '@/lib/mock-data/user-mutations';
import { updateUserSchema, type UpdateUserInput } from '@/lib/validation/staff';

export function UserActionsMenu({
  userId,
  name,
  email,
  active,
  isSelf,
  ownsContent,
  staffOptions,
}: {
  userId: string;
  name: string;
  email: string;
  active: boolean;
  isSelf: boolean;
  ownsContent: boolean;
  staffOptions: { id: string; name: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [isPending, startTransition] = useTransition();
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name, email },
  });

  function onEdit(values: UpdateUserInput) {
    startTransition(async () => {
      const result = await updateUser(userId, values);
      if (result.success) {
        toast.success(result.message);
        setEditOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={() => {
              form.reset({ name, email });
              setEditOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant={active ? 'destructive' : 'default'}
            disabled={isSelf || isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await toggleUserActive(userId);
                if (result.success) toast.success(result.message);
                else toast.error(result.message);
              })
            }
          >
            {active ? 'Suspend' : 'Reactivate'}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEdit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input icon={User} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" icon={Mail} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isPending}>
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(next) => {
          setDeleteOpen(next);
          if (!next) setReassignTo('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>
              This removes the account for {email} and signs them out for good. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {ownsContent ? (
            <div>
              <Label htmlFor={`reassign-${userId}`}>Reassign their content to</Label>
              <Select value={reassignTo} onValueChange={(value) => setReassignTo(value as string)}>
                <SelectTrigger id={`reassign-${userId}`} className="mt-1.5 w-full">
                  <SelectValue placeholder="Choose a staff member">
                    {(value: string) =>
                      staffOptions.find((option) => option.id === value)?.name ??
                      'Choose a staff member'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={ownsContent && !reassignTo}
              loading={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteUser(userId, reassignTo || undefined);
                  if (result.success) {
                    toast.success(result.message);
                    setDeleteOpen(false);
                  } else {
                    toast.error(result.message);
                  }
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
