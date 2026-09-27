export const ACCESS_REQUEST_STATUSES = ['PENDING', 'NEEDS_INFO', 'APPROVED', 'DECLINED'] as const;

export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];

export const ACCESS_REQUEST_STATUS_LABELS: Record<AccessRequestStatus, string> = {
  PENDING: 'Pending review',
  NEEDS_INFO: 'More information requested',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
};

export interface AccessRequest {
  id: string;
  contentItemId: string;
  contentTitle: string;
  userId: string;
  userName: string;
  purpose: string;
  institution: string;
  intendedUse: string;
  requestedAccessDays: number;
  status: AccessRequestStatus;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
  submittedAt: string;
  decidedAt: string | null;
  accessExpiresAt: string | null;
}
