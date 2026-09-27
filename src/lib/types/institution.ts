export const INSTITUTION_TYPES = [
  'UNIVERSITY',
  'GOVERNMENT_AGENCY',
  'NGO',
  'PRIVATE_COMPANY',
  'DEVELOPMENT_PARTNER',
  'OTHER',
] as const;

export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  UNIVERSITY: 'University',
  GOVERNMENT_AGENCY: 'Government agency',
  NGO: 'NGO',
  PRIVATE_COMPANY: 'Private company',
  DEVELOPMENT_PARTNER: 'Development partner',
  OTHER: 'Other',
};

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  country: string;
  website: string | null;
  verified: boolean;
  verifiedAt: string | null;
  subscriptionId: string | null;
  createdAt: string;
}

export const INSTITUTION_MEMBER_STATUSES = ['INVITED', 'ACTIVE', 'REMOVED'] as const;
export type InstitutionMemberStatus = (typeof INSTITUTION_MEMBER_STATUSES)[number];

export interface InstitutionMember {
  id: string;
  institutionId: string;
  userId: string | null;
  email: string;
  name: string | null;
  role: 'INSTITUTION_ADMIN' | 'INSTITUTION_MEMBER';
  status: InstitutionMemberStatus;
  invitedAt: string;
  joinedAt: string | null;
}
