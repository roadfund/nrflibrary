'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { inviteInstitutionMember } from '@/lib/mock-data/institution-mutations';

interface FormValues {
  institutionId: string;
  email: string;
  role: 'INSTITUTION_ADMIN' | 'INSTITUTION_MEMBER';
}

export function InviteMemberForm({ institutionId }: { institutionId: string }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    defaultValues: { institutionId, email: '', role: 'INSTITUTION_MEMBER' },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await inviteInstitutionMember(values);
      if (result.success) {
        toast.success(result.message);
        form.reset({ institutionId, email: '', role: 'INSTITUTION_MEMBER' });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="colleague@example.org" icon={Mail} {...field} />
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
                  <SelectTrigger className="w-full sm:w-48">
                    <ShieldCheck className="text-muted-foreground size-4" />
                    <SelectValue>
                      {(value: FormValues['role']) =>
                        value === 'INSTITUTION_ADMIN' ? 'Administrator' : 'Member'
                      }
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="INSTITUTION_MEMBER">Member</SelectItem>
                  <SelectItem value="INSTITUTION_ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <Button type="submit" loading={isPending}>
          <UserPlus className="size-4" />
          Send invite
        </Button>
      </form>
    </Form>
  );
}
