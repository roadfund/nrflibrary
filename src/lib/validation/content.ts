import { z } from 'zod';
import { ACCESS_LEVELS, CONTENT_TYPES, FILE_FORMATS } from '@/lib/types/content';
import { PLAN_CODES } from '@/lib/types/plan';
import { stripHtml } from '@/lib/html';

export const contentDraftSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters.').max(200),
    shortDescription: z
      .string()
      .refine((html) => stripHtml(html).length >= 20, 'Write at least 20 characters.')
      .refine(
        (html) => stripHtml(html).length <= 600,
        'Keep the short description under 600 characters.',
      ),
    fullDescription: z
      .string()
      .refine((html) => stripHtml(html).length >= 50, 'Write at least 50 characters.')
      .refine(
        (html) => stripHtml(html).length <= 6000,
        'Keep the full description under 6000 characters.',
      ),
    contentType: z.enum(CONTENT_TYPES),
    category: z.string().min(2, 'Enter a category.').max(100),
    tags: z.string().max(300).optional(),
    authorOrSource: z.string().min(2, 'Enter an author or source organization.').max(200),
    geographicCoverage: z.string().min(2, 'Enter geographic coverage.').max(200),
    datePublished: z.string().min(1, 'Select a publication date.'),
    dateCollected: z.string().optional(),
    fileFormat: z.enum(FILE_FORMATS),
    fileName: z.string().optional(),
    fileSizeBytes: z.coerce.number().min(0).optional(),
    checksumSha256: z.string().optional(),
    storageBucket: z.string().optional(),
    storagePath: z.string().optional(),
    externalUrl: z.string().optional(),
    licenseTerms: z.string().min(5, 'Enter license or usage terms.').max(500),
    accessLevel: z.enum(ACCESS_LEVELS),
    allowedPlanCodes: z.array(z.enum(PLAN_CODES)).default([]),
    isFeatured: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.fileFormat === 'LINK' && !data.externalUrl?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['externalUrl'],
        message: 'Enter the external link URL.',
      });
      return;
    }
    if (data.externalUrl?.trim()) {
      try {
        new URL(data.externalUrl.trim());
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['externalUrl'],
          message: 'Enter a valid URL, including https://.',
        });
      }
    }
  });

export type ContentDraftFormInput = z.input<typeof contentDraftSchema>;
export type ContentDraftInput = z.output<typeof contentDraftSchema>;
