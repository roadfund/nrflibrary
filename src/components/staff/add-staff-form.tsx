'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createStaffAccount } from '@/lib/mock-data/user-mutations';
import { createStaffAccountSchema, type CreateStaffAccountInput } from '@/lib/validation/staff';
import { ROLE_LABELS } from '@/lib/types';

const DEFAULT_VALUES: CreateStaffAccountInput = {
  name: '',
  email: '',
  role: 'PUBLISHER',
  isReviewer: false,
};

export function AddStaffForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateStaffAccountInput>({
    resolver: zodResolver(createStaffAccountSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function onSubmit(values: CreateStaffAccountInput) {
    startTransition(async () => {
      const result = await createStaffAccount(values);
      if (result.success) {
        toast.success(result.message);
        form.reset(DEFAULT_VALUES);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  const role = form.watch('role');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(DEFAULT_VALUES);
      }}
    >
      <DialogTrigger render={<Button />}>
        <UserPlus className="size-4" />
        Add staff
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a staff account</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Amara Kollie" icon={User} {...field} />
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
                    <Input type="email" placeholder="akollie@nrf.gov.lr" icon={Mail} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <ShieldCheck className="text-muted-foreground size-4" />
                        <SelectValue>
                          {(value: CreateStaffAccountInput['role']) => ROLE_LABELS[value]}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PUBLISHER">Publisher</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {role === 'PUBLISHER' ? (
              <FormField
                control={form.control}
                name="isReviewer"
                render={({ field }) => (
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="isReviewer"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(!!v)}
                    />
                    <Label htmlFor="isReviewer" className="text-sm font-normal">
                      Can review and approve restricted publications
                    </Label>
                  </div>
                )}
              />
            ) : null}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" loading={isPending}>
                Send invite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
