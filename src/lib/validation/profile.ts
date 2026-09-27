import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, 'Enter your full name.').max(120),
  organization: z.string().max(200).optional(),
  fieldOfStudy: z.string().max(120).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z.string().min(8, 'Use at least 8 characters.').max(72),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type PasswordInput = z.infer<typeof passwordSchema>;
