'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Building2,
  CalendarDays,
  FileText,
  Hash,
  Layers,
  Link as LinkIcon,
  MapPin,
  Shield,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  contentDraftSchema,
  type ContentDraftFormInput,
  type ContentDraftInput,
} from '@/lib/validation/content';
import { createContentDraft, updateContentMetadata } from '@/lib/mock-data/content-mutations';
import { uploadContentFile } from '@/lib/upload/upload-content-file';
import { MultiSelectDropdown } from '@/components/shared/multi-select-dropdown';
import {
  LIBERIA_COUNTIES,
  formatGeographicCoverage,
  parseGeographicCoverage,
} from '@/lib/types/geography';
import {
  ACCESS_LEVEL_DESCRIPTIONS,
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVELS,
  CONTENT_CATEGORIES,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  FILE_FORMATS,
  PLAN_CODES,
  type AccessLevel,
  type ContentType,
} from '@/lib/types';

function CategoryField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const isKnown = (CONTENT_CATEGORIES as readonly string[]).includes(value);
  const [isOther, setIsOther] = useState(value !== '' && !isKnown);

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={isOther ? 'Other' : value}
        onValueChange={(next) => {
          if (next === 'Other') {
            setIsOther(true);
            onChange('');
          } else {
            setIsOther(false);
            onChange(next ?? '');
          }
        }}
      >
        <SelectTrigger className="w-full">
          <Tag className="text-muted-foreground size-4" />
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {CONTENT_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
      {isOther ? (
        <Input
          placeholder="Enter a category"
          icon={Tag}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
    </div>
  );
}

export function ContentForm({
  contentItemId,
  defaultValues,
}: {
  contentItemId?: string;
  defaultValues: ContentDraftFormInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<ContentDraftFormInput, unknown, ContentDraftInput>({
    resolver: zodResolver(contentDraftSchema),
    defaultValues,
  });

  const accessLevel = form.watch('accessLevel');
  const fileFormat = form.watch('fileFormat');
  const isLink = fileFormat === 'LINK';

  function onSubmit(values: ContentDraftInput, publish: boolean) {
    startTransition(async () => {
      const result = contentItemId
        ? await updateContentMetadata(contentItemId, values)
        : await createContentDraft(values, publish);

      if (result.success) {
        toast.success(result.message);
        if (!contentItemId && result.id) {
          router.push(`/staff/library/${result.id}`);
        }
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values, false))}
        className="flex flex-col gap-10"
      >
        <section className="flex flex-col gap-4">
          <h2 className="text-foreground font-serif text-lg font-semibold">Basic information</h2>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input icon={FileText} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short description</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="One or two sentences shown in the catalogue."
                    minHeight="min-h-16"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full description</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    minHeight="min-h-48"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-foreground font-serif text-lg font-semibold">Classification</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <Layers className="text-muted-foreground size-4" />
                        <SelectValue>
                          {(value: ContentType) => CONTENT_TYPE_LABELS[value]}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CONTENT_TYPE_LABELS[type]}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategoryField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Comma-separated, e.g. pavement condition, survey"
                    icon={Hash}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="authorOrSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author / source organization</FormLabel>
                  <FormControl>
                    <Input icon={Building2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="geographicCoverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geographic coverage</FormLabel>
                  <FormControl>
                    <MultiSelectDropdown
                      label="Select coverage"
                      icon={MapPin}
                      options={['National', ...LIBERIA_COUNTIES]}
                      selected={parseGeographicCoverage(field.value)}
                      onChange={(values) => {
                        const isNewlyNational =
                          values.includes('National') &&
                          !parseGeographicCoverage(field.value).includes('National');
                        const next = isNewlyNational
                          ? ['National']
                          : values.filter((v) => v !== 'National');
                        field.onChange(formatGeographicCoverage(next));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="datePublished"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date published</FormLabel>
                  <FormControl>
                    <Input type="date" icon={CalendarDays} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateCollected"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date collected (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" icon={CalendarDays} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-foreground font-serif text-lg font-semibold">File</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="fileFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <FileText className="text-muted-foreground size-4" />
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FILE_FORMATS.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isLink ? (
              <FormField
                control={form.control}
                name="externalUrl"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." icon={LinkIcon} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        disabled={isUploading}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;

                          if (contentItemId) {
                            // Editing existing content: this field only relabels
                            // what's shown - "Replace file" below is the real
                            // upload path for a new version.
                            field.onChange(file.name);
                            form.setValue('fileSizeBytes', file.size);
                            return;
                          }

                          setIsUploading(true);
                          setUploadProgress(0);
                          const result = await uploadContentFile(file, setUploadProgress);
                          setIsUploading(false);

                          if (!result.success) {
                            toast.error(result.message);
                            event.target.value = '';
                            return;
                          }

                          field.onChange(result.file.fileName);
                          form.setValue('fileFormat', result.file.fileFormat);
                          form.setValue('fileSizeBytes', result.file.fileSizeBytes);
                          form.setValue('checksumSha256', result.file.checksumSha256);
                          form.setValue('storageBucket', result.file.storageBucket);
                          form.setValue('storagePath', result.file.storagePath);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {contentItemId
                        ? 'Uploading a new file here only updates the name shown - use "Replace file" below to create a new version.'
                        : null}
                    </FormDescription>
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <Progress value={uploadProgress} className="flex-1" />
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {uploadProgress}%
                        </span>
                      </div>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-foreground font-serif text-lg font-semibold">
            Access & distribution
          </h2>
          <FormField
            control={form.control}
            name="accessLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access level</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-80">
                      <Shield className="text-muted-foreground size-4" />
                      <SelectValue>
                        {(value: AccessLevel) => ACCESS_LEVEL_LABELS[value]}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCESS_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {ACCESS_LEVEL_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{ACCESS_LEVEL_DESCRIPTIONS[accessLevel]}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {(accessLevel === 'PLAN_RESTRICTED' ||
            accessLevel === 'REQUEST_REQUIRED' ||
            accessLevel === 'VIEW_ONLY') && (
            <FormField
              control={form.control}
              name="allowedPlanCodes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed plans</FormLabel>
                  <FormDescription>Leave empty to allow any active plan.</FormDescription>
                  <div className="mt-1 flex flex-wrap gap-4">
                    {PLAN_CODES.map((code) => (
                      <div key={code} className="flex items-center gap-2">
                        <Checkbox
                          id={`plan-${code}`}
                          checked={field.value?.includes(code)}
                          onCheckedChange={() => {
                            const current = field.value ?? [];
                            field.onChange(
                              current.includes(code)
                                ? current.filter((c) => c !== code)
                                : [...current, code],
                            );
                          }}
                        />
                        <Label htmlFor={`plan-${code}`} className="text-sm font-normal">
                          {code.charAt(0) + code.slice(1).toLowerCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is-featured"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="is-featured" className="text-sm font-normal">
                    Feature on homepage
                  </Label>
                </div>
                <FormDescription>
                  Pins this item to the homepage&apos;s featured section.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="licenseTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License / usage terms</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <div className="border-border flex items-center gap-3 border-t pt-6">
          <Button
            type="submit"
            variant={contentItemId ? 'default' : 'outline'}
            disabled={isUploading}
            loading={isPending}
          >
            {contentItemId ? 'Save changes' : 'Save as draft'}
          </Button>
          {!contentItemId ? (
            <Button
              type="button"
              disabled={isUploading}
              loading={isPending}
              onClick={form.handleSubmit((values) => onSubmit(values, true))}
            >
              Publish
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
