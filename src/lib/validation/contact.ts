import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Enter your name.').max(120),
  email: z.string().email('Enter a valid email address.'),
  subject: z.string().min(3, 'Enter a subject.').max(150),
  message: z.string().min(20, 'Message must be at least 20 characters.').max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
