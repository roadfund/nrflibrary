'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { BookOpen, Building, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { profileSchema, type ProfileInput } from '@/lib/validation/profile';
import { updateProfile } from '@/lib/auth/profile-actions';

export function ProfileForm({
  defaultValues,
  email,
}: {
  defaultValues: ProfileInput;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues });

  function onSubmit(values: ProfileInput) {
    startTransition(async () => {
      const result = await updateProfile(values);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
            Email
          </p>
          <Input value={email} icon={Mail} disabled />
          <p className="text-muted-foreground mt-1 text-xs">
            Contact support to change your email address.
          </p>
        </div>
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
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University or employer</FormLabel>
              <FormControl>
                <Input icon={Building} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fieldOfStudy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field of study or specialty</FormLabel>
              <FormControl>
                <Input icon={BookOpen} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={isPending} className="w-fit">
          Save changes
        </Button>
      </form>
    </Form>
  );
}
