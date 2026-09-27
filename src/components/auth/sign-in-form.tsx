'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SignUpDialog } from '@/components/auth/sign-up-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { signInSchema, type SignInInput } from '@/lib/validation/account';
import { signIn } from '@/lib/auth/actions';

export function SignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: SignInInput) {
    startTransition(async () => {
      const result = await signIn(values);
      if (result.success) {
        toast.success(result.message);
        router.push(result.redirectTo ?? '/dashboard');
        router.refresh();
      } else {
        form.setError('password', { message: result.message });
      }
    });
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-primary text-xs font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" icon={Lock} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={isPending} className="mt-1 h-11 w-full">
          Sign in
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{' '}
          <SignUpDialog render={<button type="button" className="text-primary hover:underline" />}>
            Sign up
          </SignUpDialog>
        </p>
      </form>
    </Form>
  );
}
