import type { Role } from '@/lib/types';
import { isStaffRole, isInstitutionRole } from '@/lib/types/roles';

export const MAIN_NAV = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;

export function getAccountHomeHref(role: Role): string {
  if (isStaffRole(role)) return '/staff';
  return '/dashboard';
}

/**
 * Every non-staff role shares one dashboard and one account nav. Billing
 * differs by ownership model (a personal subscription vs. an institution's
 * seat-based plan), so that one link is swapped rather than duplicated;
 * institution accounts also get their org-management pages appended
 * (member management and org billing/profile are admin-only, the rest is
 * visible to any institution member). Nothing here links to a page a given
 * role's guard would immediately bounce them out of.
 */
export function getAccountNav(role: Role): { href: string; label: string }[] {
  const isAdmin = role === 'INSTITUTION_ADMIN';
  const isInstitution = isInstitutionRole(role);

  return [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/downloads', label: 'My downloads' },
    { href: '/requests', label: 'My access requests' },
    { href: '/saved', label: 'Saved items' },
    ...(isInstitution ? [] : [{ href: '/billing', label: 'Subscription & billing' }]),
    { href: '/profile', label: 'Profile & password' },
    ...(isInstitution
      ? [
          ...(isAdmin
            ? [
                { href: '/institution/profile', label: 'Institution profile' },
                { href: '/institution/members', label: 'Member management' },
                { href: '/institution/billing', label: 'Institution billing' },
              ]
            : []),
          { href: '/institution/usage', label: 'Usage summary' },
          { href: '/institution/activity', label: 'Downloads & requests' },
        ]
      : []),
  ];
}

export const STAFF_NAV = [
  { href: '/staff', label: 'Dashboard' },
  { href: '/staff/library', label: 'Content library' },
  { href: '/staff/review', label: 'Drafts & review queue' },
  { href: '/staff/requests', label: 'Access requests' },
  { href: '/staff/users', label: 'Users' },
  { href: '/staff/institutions', label: 'Institutions' },
  { href: '/staff/plans', label: 'Subscription plans' },
  { href: '/staff/audit-log', label: 'Audit log' },
  { href: '/staff/settings', label: 'Platform settings' },
] as const;
