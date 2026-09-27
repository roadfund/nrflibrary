import { describe, expect, it } from 'vitest';
import { evaluateAccess, type AccessSubjectItem } from './evaluate-access';

const publishedSubscriberItem: AccessSubjectItem = {
  status: 'PUBLISHED',
  accessLevel: 'SUBSCRIBER',
  allowedPlanCodes: [],
};

describe('evaluateAccess', () => {
  it('allows anyone to see the listing for a published, non-internal item', () => {
    const result = evaluateAccess({
      item: publishedSubscriberItem,
      user: null,
      subscription: null,
    });
    expect(result.canViewListing).toBe(true);
    expect(result.canViewDetail).toBe(false);
    expect(result.reasons).toContain('SIGN_IN_REQUIRED');
  });

  it('grants PUBLIC items full access to anonymous, signed-out visitors', () => {
    const result = evaluateAccess({
      item: { status: 'PUBLISHED', accessLevel: 'PUBLIC', allowedPlanCodes: [] },
      user: null,
      subscription: null,
    });
    expect(result.canViewDetail).toBe(true);
    expect(result.canDownload).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('hides draft items from the public entirely', () => {
    const result = evaluateAccess({
      item: { ...publishedSubscriberItem, status: 'DRAFT' },
      user: null,
      subscription: null,
    });
    expect(result.canViewListing).toBe(false);
    expect(result.reasons).toEqual(['NOT_PUBLISHED']);
  });

  it('never exposes INTERNAL items to non-staff, even when published', () => {
    const result = evaluateAccess({
      item: { ...publishedSubscriberItem, accessLevel: 'INTERNAL' },
      user: { role: 'RESEARCHER' },
      subscription: {
        status: 'ACTIVE',
        planCode: 'STANDARD',
        downloadLimitPerMonth: null,
        downloadsUsedThisPeriod: 0,
      },
    });
    expect(result.canViewListing).toBe(false);
    expect(result.reasons).toEqual(['STAFF_ONLY']);
  });

  it('grants staff full access regardless of subscription state', () => {
    const result = evaluateAccess({
      item: { ...publishedSubscriberItem, accessLevel: 'INTERNAL' },
      user: { role: 'PUBLISHER' },
      subscription: null,
    });
    expect(result.isStaffOverride).toBe(true);
    expect(result.canDownload).toBe(true);
  });

  it('requires an active subscription to view details, not just an account', () => {
    const result = evaluateAccess({
      item: publishedSubscriberItem,
      user: { role: 'STUDENT' },
      subscription: {
        status: 'PAST_DUE',
        planCode: 'STANDARD',
        downloadLimitPerMonth: null,
        downloadsUsedThisPeriod: 0,
      },
    });
    expect(result.canViewDetail).toBe(false);
    expect(result.reasons).toEqual(['SUBSCRIPTION_INACTIVE']);
  });

  it('grants PLAN_RESTRICTED items to a subscriber on an allowed plan', () => {
    // With a single flat plan today there's no "wrong plan" to deny - this
    // just confirms the gate still passes a subscriber whose plan is listed.
    const item: AccessSubjectItem = {
      status: 'PUBLISHED',
      accessLevel: 'PLAN_RESTRICTED',
      allowedPlanCodes: ['STANDARD'],
    };
    const result = evaluateAccess({
      item,
      user: { role: 'RESEARCHER' },
      subscription: {
        status: 'ACTIVE',
        planCode: 'STANDARD',
        downloadLimitPerMonth: null,
        downloadsUsedThisPeriod: 0,
      },
    });
    expect(result.canDownload).toBe(true);
  });

  it('disables downloads for VIEW_ONLY items even for permitted subscribers', () => {
    const result = evaluateAccess({
      item: { status: 'PUBLISHED', accessLevel: 'VIEW_ONLY', allowedPlanCodes: [] },
      user: { role: 'STUDENT' },
      subscription: {
        status: 'ACTIVE',
        planCode: 'STANDARD',
        downloadLimitPerMonth: null,
        downloadsUsedThisPeriod: 0,
      },
    });
    expect(result.canPreview).toBe(true);
    expect(result.canDownload).toBe(false);
    expect(result.reasons).toContain('DOWNLOAD_NOT_PERMITTED');
  });

  it('requires reviewer approval before granting REQUEST_REQUIRED access', () => {
    const item: AccessSubjectItem = {
      status: 'PUBLISHED',
      accessLevel: 'REQUEST_REQUIRED',
      allowedPlanCodes: [],
    };
    const pending = evaluateAccess({
      item,
      user: { role: 'RESEARCHER' },
      subscription: {
        status: 'ACTIVE',
        planCode: 'STANDARD',
        downloadLimitPerMonth: null,
        downloadsUsedThisPeriod: 0,
      },
    });
    expect(pending.canRequestAccess).toBe(true);
    expect(pending.canDownload).toBe(false);

    const approved = evaluateAccess({
      item,
      user: { role: 'RESEARCHER' },
      subscription: {
        status: 'ACTIVE',
        planCode: 'STANDARD',
        downloadLimitPerMonth: null,
        downloadsUsedThisPeriod: 0,
      },
      hasApprovedAccessGrant: true,
    });
    expect(approved.canDownload).toBe(true);
  });

  it('blocks downloads once the monthly plan limit is reached', () => {
    const result = evaluateAccess({
      item: publishedSubscriberItem,
      user: { role: 'STUDENT' },
      subscription: {
        status: 'ACTIVE',
        planCode: 'STANDARD',
        downloadLimitPerMonth: 5,
        downloadsUsedThisPeriod: 5,
      },
    });
    expect(result.canPreview).toBe(true);
    expect(result.canDownload).toBe(false);
    expect(result.reasons).toContain('DOWNLOAD_LIMIT_REACHED');
  });
});
