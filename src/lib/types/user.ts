import type { Role } from './roles';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** PUBLISHER accounts with reviewer capability may approve restricted content. */
  isReviewer: boolean;
  institutionId: string | null;
  organization: string | null;
  fieldOfStudy: string | null;
  emailVerified: boolean;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}
