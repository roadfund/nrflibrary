'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building,
  Building2,
  BookOpen,
  GraduationCap,
  Globe,
  Layers,
  Lock,
  Mail,
  Microscope,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import {
  createAccountSchema,
  type AccountType,
  type CreateAccountFormInput,
  type CreateAccountInput,
} from '@/lib/validation/account';
import { createAccount } from '@/lib/auth/actions';
import { INSTITUTION_TYPE_LABELS, INSTITUTION_TYPES } from '@/lib/types/institution';

const ACCOUNT_TYPE_OPTIONS: {
  value: AccountType;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Enrolled at a university or college.',
    icon: GraduationCap,
  },
  {
    value: 'RESEARCHER',
    label: 'Researcher',
    description: 'Independent researcher, journalist, or consultant.',
    icon: Microscope,
  },
  {
    value: 'INSTITUTION',
    label: 'Institution',
    description: 'Register on behalf of an organization.',
    icon: Building2,
  },
];

const STEP_FIELDS: Record<number, (keyof CreateAccountFormInput)[]> = {
  0: ['accountType'],
  1: ['name', 'email', 'password', 'termsAccepted'],
  2: ['organization', 'fieldOfStudy', 'institutionName', 'institutionType', 'institutionCountry'],
};

export function CreateAccountWizard({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type');
  const [step, setStep] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CreateAccountFormInput, unknown, CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      accountType:
        initialType === 'INSTITUTION'
          ? 'INSTITUTION'
          : initialType === 'RESEARCHER'
            ? 'RESEARCHER'
            : 'STUDENT',
      name: '',
      email: '',
      password: '',
      organization: '',
      fieldOfStudy: '',
      institutionName: '',
      institutionCountry: 'Liberia',
      termsAccepted: false,
    },
  });

  const accountType = form.watch('accountType');
  const isInstitution = accountType === 'INSTITUTION';

  async function goNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, 2));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(values: CreateAccountInput) {
    setIsPending(true);
    let result: Awaited<ReturnType<typeof createAccount>>;
    try {
      result = await createAccount(values);
    } catch {
      toast.error('Something went wrong. Refresh the page and try again.');
      return;
    } finally {
      setIsPending(false);
    }
    if (result.success) {
      toast.success(result.message);
      onClose?.();
      router.push(result.redirectTo ?? '/dashboard');
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  const stepTitle =
    step === 0
      ? 'Create your account'
      : step === 1
        ? 'Your details'
        : isInstitution
          ? 'Institution details'
          : 'A bit more about you';

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 2) {
            void goNext();
          } else {
            void form.handleSubmit(onSubmit)(event);
          }
        }}
        className="flex flex-col gap-5"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1"
                >
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Back</span>
                </button>
              ) : null}
              <h2 className="text-foreground font-serif text-xl font-semibold">{stepTitle}</h2>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1.5"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i <= step ? 'bg-primary w-6' : 'bg-muted w-1.5',
                )}
              />
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">How will you use the Research Hub?</p>
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col gap-3">
                    {ACCOUNT_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          field.onChange(option.value);
                          setStep(1);
                        }}
                        className="border-border hover:bg-muted/50 flex items-start gap-4 rounded-xl border p-4 text-left transition-colors"
                      >
                        <span className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                          <option.icon className="size-5" />
                        </span>
                        <span>
                          <span className="text-foreground block text-sm font-semibold">
                            {option.label}
                          </span>
                          <span className="text-muted-foreground mt-0.5 block text-xs">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="text-primary font-medium hover:underline"
                onClick={onClose}
              >
                Sign in
              </Link>
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isInstitution ? 'Administrator name' : 'Full name'}</FormLabel>
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" icon={Lock} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms-accepted"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms-accepted" className="text-muted-foreground text-sm">
                      I agree to the Terms of use and Privacy policy.
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-1 h-11 w-full">
              Continue
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            {isInstitution ? (
              <>
                <FormField
                  control={form.control}
                  name="institutionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution name</FormLabel>
                      <FormControl>
                        <Input icon={Building2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="institutionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <Layers className="text-muted-foreground size-4" />
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INSTITUTION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {INSTITUTION_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="institutionCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input icon={Globe} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
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
              </>
            )}
            <Button type="submit" loading={isPending} className="mt-1 h-11 w-full">
              Create account
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
