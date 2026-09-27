'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Clock, HardDrive, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { updatePlatformSettings } from '@/lib/mock-data/settings-mutations';
import type { PlatformSettings } from '@/lib/mock-data/settings';

export function SettingsForm({ defaultValues }: { defaultValues: PlatformSettings }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PlatformSettings>({ defaultValues });

  function onSubmit(values: PlatformSettings) {
    startTransition(async () => {
      const result = await updatePlatformSettings(values);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-5">
        <FormField
          control={form.control}
          name="maxUploadSizeMb"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum upload size (MB)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={2000}
                  icon={HardDrive}
                  {...field}
                  value={field.value as number}
                />
              </FormControl>
              <FormDescription>Applies to all content types, including GIS files.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultAccessRequestDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default access request period (days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  icon={Clock}
                  {...field}
                  value={field.value as number}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supportEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support email</FormLabel>
              <FormControl>
                <Input type="email" icon={Mail} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="requireInstitutionVerification"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <Switch
                  id="require-verification"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="require-verification" className="font-normal">
                  Require staff verification before institution subscriptions activate
                </Label>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" loading={isPending} className="w-fit">
          Save settings
        </Button>
      </form>
    </Form>
  );
}
