import { redirect } from 'next/navigation';
import type { Role } from '@/lib/types';
import { isInstitutionRole, isStaffRole } from '@/lib/types/roles';
import { getSession, getSessionIncludingUnverified } from './session';

interface RequireUserOptions {
  roles?: Role[];
  redirectTo?: string;
}

/**
 * Server-side gate for pages, layouts, and server actions that require an
 * authenticated user (optionally restricted to specific roles). Never rely
 * on hiding a link as the only protection - every route this guards must
 * call it before reading or mutating anything sensitive.
 */
export async function requireUser(options: RequireUserOptions = {}) {
  const session = await getSession();

  if (!session) {
    if (await getSessionIncludingUnverified()) redirect('/verify-email');
    const next = options.redirectTo ?? '/sign-in';
    redirect(next);
  }

  if (options.roles && !options.roles.includes(session.user.role)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Guards the shared account area (dashboard, downloads, requests, saved) -
 * every non-staff role lands here, individual and institution alike. Staff
 * accounts are redirected to the tool built for them rather than shown
 * "unauthorized" - they are authenticated, just in the wrong section.
 */
export async function requireAccountUser() {
  const session = await requireUser();
  if (isStaffRole(session.user.role)) redirect('/staff');
  return session;
}

/**
 * Guards the individual-only pages (billing, profile) whose data model
 * doesn't apply to institution accounts - an institution member's
 * subscription and profile live at the institution level, not the user
 * level. Institution and staff accounts are bounced back to the shared
 * dashboard rather than shown "unauthorized".
 */
export async function requireIndividualSubscriber() {
  const session = await requireUser();
  if (isInstitutionRole(session.user.role)) redirect('/dashboard');
  if (isStaffRole(session.user.role)) redirect('/staff');
  return session;
}

export async function requireInstitutionUser() {
  const session = await requireUser();
  if (isStaffRole(session.user.role)) redirect('/staff');
  if (!isInstitutionRole(session.user.role)) redirect('/dashboard');
  return session;
}

export async function requireStaff() {
  return requireUser({ roles: ['SUPER_ADMIN', 'PUBLISHER'] });
}

/**
 * Institution profile, member management, and billing are administrator-only
 * per the spec (members can access content but not manage the account).
 * Members hitting these pages are redirected to the shared dashboard.
 */
export async function requireInstitutionAdmin() {
  const session = await requireInstitutionUser();
  if (session.user.role !== 'INSTITUTION_ADMIN') redirect('/dashboard');
  return session;
}
