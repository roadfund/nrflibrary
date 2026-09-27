'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  accessRequestSchema,
  type AccessRequestFormInput,
  type AccessRequestInput,
} from '@/lib/validation/access-request';
import { submitAccessRequest } from '@/lib/mock-data/mutations';

export function AccessRequestDialog({
  contentItemId,
  contentTitle,
  defaultInstitution,
}: {
  contentItemId: string;
  contentTitle: string;
  defaultInstitution: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AccessRequestFormInput, unknown, AccessRequestInput>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: {
      contentItemId,
      purpose: '',
      institution: defaultInstitution,
      intendedUse: '',
      requestedAccessDays: 30,
    },
  });

  function onSubmit(values: AccessRequestInput) {
    startTransition(async () => {
      const result = await submitAccessRequest(values);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
        <Lock className="size-4" />
        Request access
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request access</DialogTitle>
          <DialogDescription>
            Explain your research purpose for &ldquo;{contentTitle}&rdquo;. A reviewer will approve,
            decline, or ask for more information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research purpose</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What are you researching, and why do you need this data?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your university, employer, or 'Independent'"
                      icon={Building}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="intendedUse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intended use</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="How will you use this data, and will results be published or shared?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestedAccessDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested access period (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={7}
                      max={180}
                      icon={Clock}
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <FormDescription>Typical grants run 30–90 days.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" loading={isPending}>
                Submit request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
