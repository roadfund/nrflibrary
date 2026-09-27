'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail } from 'lucide-react';
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
import { requestPasswordReset } from '@/lib/auth/actions';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
});
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: ForgotPasswordInput) {
    startTransition(async () => {
      const result = await requestPasswordReset(values.email);
      if (result.success) {
        setSent(true);
      } else {
        form.setError('email', { message: result.message });
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link
          href="/sign-in"
          className="text-primary flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" icon={Mail} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={isPending} className="mt-1 h-11 w-full">
          Send reset link
        </Button>
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </form>
    </Form>
  );
}
