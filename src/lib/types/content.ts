import type { PlanCode } from './plan';

export const CONTENT_TYPES = [
  'DATASET',
  'REPORT',
  'RESEARCH_PAPER',
  'POLICY_DOCUMENT',
  'MAP_GIS',
  'PROJECT_DOCUMENT',
  'DASHBOARD_LINK',
  'ANNUAL_PUBLICATION',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_CATEGORIES = [
  'Funding & Finance',
  'Mapping',
  'Policy',
  'Procurement',
  'Project Planning',
  'Public Transport',
  'Road Condition',
  'Road Safety',
  'Rural Access',
  'Structures',
] as const;

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  DATASET: 'Dataset',
  REPORT: 'Report',
  RESEARCH_PAPER: 'Research paper',
  POLICY_DOCUMENT: 'Policy document',
  MAP_GIS: 'Map / GIS resource',
  PROJECT_DOCUMENT: 'Project document',
  DASHBOARD_LINK: 'Dashboard link',
  ANNUAL_PUBLICATION: 'Annual publication',
};

/**
 * The spec's metadata list names only draft / in review / published /
 * archived, but the publishing workflow requires a reviewer to be able to
 * request changes or reject a submission. CHANGES_REQUESTED and REJECTED
 * are added so the review queue can represent those outcomes distinctly
 * instead of silently reverting to DRAFT.
 */
export const CONTENT_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'CHANGES_REQUESTED',
  'REJECTED',
  'PUBLISHED',
  'ARCHIVED',
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  CHANGES_REQUESTED: 'Changes requested',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export const ACCESS_LEVELS = [
  'PUBLIC',
  'SUBSCRIBER',
  'PLAN_RESTRICTED',
  'REQUEST_REQUIRED',
  'VIEW_ONLY',
  'INTERNAL',
] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  PUBLIC: 'Public',
  SUBSCRIBER: 'Subscriber access',
  PLAN_RESTRICTED: 'Plan restricted',
  REQUEST_REQUIRED: 'Request required',
  VIEW_ONLY: 'View only',
  INTERNAL: 'Internal (staff only)',
};

export const ACCESS_LEVEL_DESCRIPTIONS: Record<AccessLevel, string> = {
  PUBLIC: 'Anyone can view and download - no account or subscription required.',
  SUBSCRIBER: 'Available to any subscriber with an active plan.',
  PLAN_RESTRICTED: 'Available only to selected plans or roles.',
  REQUEST_REQUIRED: 'Requires a purpose-of-use request and reviewer approval.',
  VIEW_ONLY: 'Viewable in the browser by permitted subscribers. Downloading is disabled.',
  INTERNAL: 'Visible to Road Fund staff only.',
};

export const FILE_FORMATS = [
  'PDF',
  'CSV',
  'XLSX',
  'DOCX',
  'PPTX',
  'ZIP',
  'GEOJSON',
  'SHP',
  'KML',
  'PNG',
  'JPEG',
  'WEBP',
  'MP3',
  'MP4',
  'LINK',
] as const;

export type FileFormat = (typeof FILE_FORMATS)[number];

export interface ContentVersion {
  id: string;
  contentItemId: string;
  versionNumber: number;
  fileName: string;
  fileFormat: FileFormat;
  fileSizeBytes: number;
  checksumSha256: string;
  /** Supabase Storage location of the real uploaded file, if one exists. Null for pre-Supabase seed content. */
  storageBucket: string | null;
  storagePath: string | null;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedAt: string;
  changeNote: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  contentType: ContentType;
  category: string;
  tags: string[];
  authorOrSource: string;
  geographicCoverage: string;
  datePublished: string;
  dateCollected: string | null;
  fileFormat: FileFormat;
  fileSizeBytes: number;
  /** Current version's Supabase Storage location, if a real file has been uploaded. Null for pre-Supabase seed content. */
  storageBucket: string | null;
  storagePath: string | null;
  /** Only meaningful when fileFormat is LINK. */
  externalUrl: string | null;
  licenseTerms: string;
  accessLevel: AccessLevel;
  /** Plan codes permitted when accessLevel is PLAN_RESTRICTED or REQUEST_REQUIRED. Empty = any active plan. */
  allowedPlanCodes: PlanCode[];
  status: ContentStatus;
  isFeatured: boolean;
  versionNumber: number;
  relatedItemIds: string[];
  downloadCount: number;
  viewCount: number;
  fileChecksumSha256: string;
  ownerUserId: string;
  ownerName: string;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  submittedForReviewAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
}

export type ContentSummary = Pick<
  ContentItem,
  | 'id'
  | 'slug'
  | 'title'
  | 'shortDescription'
  | 'contentType'
  | 'category'
  | 'tags'
  | 'authorOrSource'
  | 'geographicCoverage'
  | 'datePublished'
  | 'fileFormat'
  | 'fileSizeBytes'
  | 'accessLevel'
  | 'status'
  | 'downloadCount'
  | 'viewCount'
>;
