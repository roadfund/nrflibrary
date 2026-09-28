import { z } from 'zod';
import { GRANT_CATEGORIES } from '@/lib/types/plan';

export const MAX_GRANT_YEARS = 5;

export const grantSubscriptionSchema = z
  .object({
    ownerType: z.enum(['USER', 'INSTITUTION']),
    ownerId: z.string().uuid('Choose who receives the subscription.'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose an end date.'),
    category: z.enum(GRANT_CATEGORIES),
    note: z.string().trim().max(500, 'Keep the note under 500 characters.').optional(),
    seats: z.number().int().min(1, 'At least 1 seat.').max(10000).optional(),
  })
  .superRefine((data, ctx) => {
    const end = new Date(`${data.endDate}T23:59:59Z`);
    const now = new Date();
    const max = new Date(now);
    max.setUTCFullYear(max.getUTCFullYear() + MAX_GRANT_YEARS);
    if (Number.isNaN(end.getTime()) || end <= now) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be in the future.',
      });
    } else if (end > max) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: `End date can be at most ${MAX_GRANT_YEARS} years away.`,
      });
    }
    if (data.ownerType === 'INSTITUTION' && !data.seats) {
      ctx.addIssue({ code: 'custom', path: ['seats'], message: 'Enter the number of seats.' });
    }
  });

export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;
