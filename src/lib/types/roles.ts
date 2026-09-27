/**
 * User roles. Mirrors the eventual Postgres enum.
 *
 * The spec describes a "reviewer" capability for approving restricted
 * publications, but does not list it as its own numbered role - it is
 * granted to PUBLISHER accounts as a flag (see User.isReviewer) rather than
 * a separate role, since reviewers are still Road Fund publishing staff.
 */
export const ROLES = [
  'SUPER_ADMIN',
  'PUBLISHER',
  'STUDENT',
  'RESEARCHER',
  'INSTITUTION_ADMIN',
  'INSTITUTION_MEMBER',
] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'PUBLISHER'];
export const INSTITUTION_ROLES: Role[] = ['INSTITUTION_ADMIN', 'INSTITUTION_MEMBER'];
export const INDIVIDUAL_SUBSCRIBER_ROLES: Role[] = ['STUDENT', 'RESEARCHER'];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function isInstitutionRole(role: Role): boolean {
  return INSTITUTION_ROLES.includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  PUBLISHER: 'Publisher',
  STUDENT: 'Student',
  RESEARCHER: 'Researcher',
  INSTITUTION_ADMIN: 'Institution Admin',
  INSTITUTION_MEMBER: 'Institution Member',
};
