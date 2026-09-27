import { z } from 'zod';

export const createStaffAccountSchema = z.object({
  name: z.string().trim().min(2, "Enter the staff member's full name."),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  role: z.enum(['SUPER_ADMIN', 'PUBLISHER']),
  isReviewer: z.boolean(),
});

export type CreateStaffAccountInput = z.infer<typeof createStaffAccountSchema>;
