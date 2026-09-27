import type { User } from '@/lib/types';

export const EMAIL_VERIFICATION_GRACE_DAYS = 3;

export function getVerificationDeadline(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + EMAIL_VERIFICATION_GRACE_DAYS * 86_400_000);
}

export function isVerificationOverdue(
  user: Pick<User, 'emailVerified' | 'createdAt'>,
  now: Date = new Date(),
): boolean {
  return !user.emailVerified && now >= getVerificationDeadline(user.createdAt);
}
