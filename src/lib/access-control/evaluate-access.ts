import { isStaffRole } from '@/lib/types/roles';
import type { AccessLevel, ContentStatus } from '@/lib/types/content';
import type { PlanCode, SubscriptionStatus } from '@/lib/types/plan';
import type { Role } from '@/lib/types/roles';

export interface AccessSubject {
  role: Role;
  isReviewer?: boolean;
}

export interface AccessSubscription {
  status: SubscriptionStatus;
  planCode: PlanCode;
  downloadLimitPerMonth: number | null;
  downloadsUsedThisPeriod: number;
}

export interface AccessSubjectItem {
  status: ContentStatus;
  accessLevel: AccessLevel;
  allowedPlanCodes: PlanCode[];
  ownerUserId?: string;
}

export interface EvaluateAccessInput {
  item: AccessSubjectItem;
  /** null when the visitor is not signed in. */
  user: AccessSubject | null;
  /** The user's own subscription, or their institution's, whichever applies. null if none / not active. */
  subscription: AccessSubscription | null;
  /** For REQUEST_REQUIRED items: does the user hold an approved, unexpired access grant? */
  hasApprovedAccessGrant?: boolean;
}

export type AccessDenialReason =
  | 'SIGN_IN_REQUIRED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'SUBSCRIPTION_INACTIVE'
  | 'PLAN_DOES_NOT_INCLUDE_ITEM'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_PENDING'
  | 'DOWNLOAD_NOT_PERMITTED'
  | 'DOWNLOAD_LIMIT_REACHED'
  | 'STAFF_ONLY'
  | 'NOT_PUBLISHED';

export interface AccessEvaluation {
  /** True once the item is published; controls whether it appears in the public catalogue at all. */
  canViewListing: boolean;
  /** Full description, metadata, and file details. */
  canViewDetail: boolean;
  canPreview: boolean;
  canDownload: boolean;
  canRequestAccess: boolean;
  isStaffOverride: boolean;
  reasons: AccessDenialReason[];
}

function denyAll(reasons: AccessDenialReason[]): AccessEvaluation {
  return {
    canViewListing: false,
    canViewDetail: false,
    canPreview: false,
    canDownload: false,
    canRequestAccess: false,
    isStaffOverride: false,
    reasons,
  };
}

/**
 * Pure, server-safe access decision for a single content item. Used by
 * catalogue listings, publication detail pages, and file download/preview
 * route handlers alike so the rule set only lives in one place. Never trust
 * a client-rendered version of this decision - callers must re-evaluate on
 * every server request that serves protected data or files.
 */
export function evaluateAccess({
  item,
  user,
  subscription,
  hasApprovedAccessGrant = false,
}: EvaluateAccessInput): AccessEvaluation {
  const isStaff = user !== null && isStaffRole(user.role);

  if (isStaff) {
    return {
      canViewListing: true,
      canViewDetail: true,
      canPreview: true,
      canDownload: true,
      canRequestAccess: false,
      isStaffOverride: true,
      reasons: [],
    };
  }

  if (item.accessLevel === 'INTERNAL') {
    return denyAll(['STAFF_ONLY']);
  }

  if (item.status !== 'PUBLISHED') {
    return denyAll(['NOT_PUBLISHED']);
  }

  if (item.accessLevel === 'PUBLIC') {
    return {
      canViewListing: true,
      canViewDetail: true,
      canPreview: true,
      canDownload: true,
      canRequestAccess: false,
      isStaffOverride: false,
      reasons: [],
    };
  }

  // Public catalogue metadata is always visible for published, non-internal items.
  const base: AccessEvaluation = {
    canViewListing: true,
    canViewDetail: false,
    canPreview: false,
    canDownload: false,
    canRequestAccess: false,
    isStaffOverride: false,
    reasons: [],
  };

  if (!user) {
    return { ...base, reasons: ['SIGN_IN_REQUIRED'] };
  }

  if (!subscription) {
    return { ...base, reasons: ['SUBSCRIPTION_REQUIRED'] };
  }

  if (subscription.status !== 'ACTIVE') {
    return { ...base, reasons: ['SUBSCRIPTION_INACTIVE'] };
  }

  // Signed in with an active subscription: detail metadata is visible from here on.
  base.canViewDetail = true;

  const planPermits =
    item.allowedPlanCodes.length === 0 || item.allowedPlanCodes.includes(subscription.planCode);

  const downloadLimitReached =
    subscription.downloadLimitPerMonth !== null &&
    subscription.downloadsUsedThisPeriod >= subscription.downloadLimitPerMonth;

  switch (item.accessLevel) {
    case 'SUBSCRIBER': {
      base.canPreview = true;
      base.canDownload = !downloadLimitReached;
      if (downloadLimitReached) base.reasons.push('DOWNLOAD_LIMIT_REACHED');
      return base;
    }
    case 'PLAN_RESTRICTED': {
      if (!planPermits) {
        return { ...base, reasons: ['PLAN_DOES_NOT_INCLUDE_ITEM'] };
      }
      base.canPreview = true;
      base.canDownload = !downloadLimitReached;
      if (downloadLimitReached) base.reasons.push('DOWNLOAD_LIMIT_REACHED');
      return base;
    }
    case 'VIEW_ONLY': {
      if (!planPermits) {
        return { ...base, reasons: ['PLAN_DOES_NOT_INCLUDE_ITEM'] };
      }
      base.canPreview = true;
      base.canDownload = false;
      base.reasons.push('DOWNLOAD_NOT_PERMITTED');
      return base;
    }
    case 'REQUEST_REQUIRED': {
      if (!planPermits) {
        return { ...base, reasons: ['PLAN_DOES_NOT_INCLUDE_ITEM'] };
      }
      if (hasApprovedAccessGrant) {
        base.canPreview = true;
        base.canDownload = !downloadLimitReached;
        if (downloadLimitReached) base.reasons.push('DOWNLOAD_LIMIT_REACHED');
        return base;
      }
      base.canRequestAccess = true;
      base.reasons.push('APPROVAL_REQUIRED');
      return base;
    }
    default:
      return base;
  }
}
