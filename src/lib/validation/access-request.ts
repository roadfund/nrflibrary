import { z } from 'zod';

export const accessRequestSchema = z.object({
  contentItemId: z.string().min(1),
  purpose: z
    .string()
    .min(20, 'Describe your research purpose in at least 20 characters.')
    .max(1000),
  institution: z.string().min(2, 'Enter your institution or "Independent".').max(200),
  intendedUse: z
    .string()
    .min(20, 'Describe your intended use in at least 20 characters.')
    .max(1000),
  requestedAccessDays: z.coerce
    .number()
    .int()
    .min(7, 'Request at least 7 days of access.')
    .max(180, 'Requests over 180 days need to be discussed with Road Fund staff directly.'),
});

/** Raw form values before zod coerces `requestedAccessDays` to a number. */
export type AccessRequestFormInput = z.input<typeof accessRequestSchema>;
/** Values after validation, as received by the submit handler and server action. */
export type AccessRequestInput = z.output<typeof accessRequestSchema>;
