import { z } from 'zod';
import { INSTITUTION_TYPES } from '@/lib/types/institution';

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const ACCOUNT_TYPES = ['STUDENT', 'RESEARCHER', 'INSTITUTION'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * Signup only collects identity - no plan or payment. New accounts land on
 * the dashboard with no subscription and are prompted to choose a plan from
 * there (see the billing pages' empty state), rather than being walked
 * through a checkout before they've seen the product.
 */
export const createAccountSchema = z
  .object({
    accountType: z.enum(ACCOUNT_TYPES),
    name: z.string().min(2, 'Enter your full name.').max(120),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Use at least 8 characters.').max(72),
    organization: z.string().max(200).optional(),
    fieldOfStudy: z.string().max(120).optional(),
    institutionName: z.string().max(200).optional(),
    institutionType: z.enum(INSTITUTION_TYPES).optional(),
    institutionCountry: z.string().max(100).optional(),
    termsAccepted: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.termsAccepted) {
      ctx.addIssue({
        code: 'custom',
        path: ['termsAccepted'],
        message: 'You must accept the terms to continue.',
      });
    }
    if (data.accountType === 'INSTITUTION') {
      if (!data.institutionName || data.institutionName.trim().length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['institutionName'],
          message: 'Enter your institution name.',
        });
      }
      if (!data.institutionType) {
        ctx.addIssue({
          code: 'custom',
          path: ['institutionType'],
          message: 'Select an institution type.',
        });
      }
      if (!data.institutionCountry || data.institutionCountry.trim().length < 2) {
        ctx.addIssue({ code: 'custom', path: ['institutionCountry'], message: 'Enter a country.' });
      }
    } else if (!data.organization || data.organization.trim().length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['organization'],
        message: 'Enter your university or employer.',
      });
    }
  });

export type CreateAccountFormInput = z.input<typeof createAccountSchema>;
/** Values after validation, as received by the submit handler and server action. */
export type CreateAccountInput = z.output<typeof createAccountSchema>;
