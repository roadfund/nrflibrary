'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, Globe, Layers, Link2 } from 'lucide-react';
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
import { updateInstitutionProfile } from '@/lib/mock-data/institution-mutations';
import {
  INSTITUTION_TYPE_LABELS,
  INSTITUTION_TYPES,
  type InstitutionType,
} from '@/lib/types/institution';

interface FormValues {
  institutionId: string;
  name: string;
  type: InstitutionType;
  country: string;
  website: string;
}

export function InstitutionProfileForm({ defaultValues }: { defaultValues: FormValues }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({ defaultValues });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateInstitutionProfile(values);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <Layers className="text-muted-foreground size-4" />
                      <SelectValue>
                        {(value: InstitutionType) => INSTITUTION_TYPE_LABELS[value]}
                      </SelectValue>
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
            name="country"
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
        </div>
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://" icon={Link2} {...field} />
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
