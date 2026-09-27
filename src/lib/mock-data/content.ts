import { createClient } from '@/lib/supabase/server';
import { CONTENT_CATEGORIES } from '@/lib/types';
import type { ContentItem, ContentVersion } from '@/lib/types';

type ContentItemRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  content_type: ContentItem['contentType'];
  category: string;
  tags: string[];
  author_or_source: string;
  geographic_coverage: string;
  date_published: string;
  date_collected: string | null;
  file_format: ContentItem['fileFormat'];
  file_size_bytes: number;
  storage_bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
  license_terms: string;
  access_level: ContentItem['accessLevel'];
  allowed_plan_codes: ContentItem['allowedPlanCodes'];
  status: ContentItem['status'];
  is_featured: boolean;
  version_number: number;
  related_item_ids: string[];
  download_count: number;
  view_count: number;
  file_checksum_sha256: string;
  owner_user_id: string;
  owner_name: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  submitted_for_review_at: string | null;
  published_at: string | null;
  archived_at: string | null;
};

type ContentVersionRow = {
  id: string;
  content_item_id: string;
  version_number: number;
  file_name: string;
  file_format: ContentVersion['fileFormat'];
  file_size_bytes: number;
  checksum_sha256: string;
  storage_bucket: string | null;
  storage_path: string | null;
  uploaded_by_user_id: string;
  uploaded_by_name: string;
  uploaded_at: string;
  change_note: string;
};

function toContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    contentType: row.content_type,
    category: row.category,
    tags: row.tags,
    authorOrSource: row.author_or_source,
    geographicCoverage: row.geographic_coverage,
    datePublished: row.date_published,
    dateCollected: row.date_collected,
    fileFormat: row.file_format,
    fileSizeBytes: row.file_size_bytes,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    externalUrl: row.external_url,
    licenseTerms: row.license_terms,
    accessLevel: row.access_level,
    allowedPlanCodes: row.allowed_plan_codes,
    status: row.status,
    isFeatured: row.is_featured,
    versionNumber: row.version_number,
    relatedItemIds: row.related_item_ids,
    downloadCount: row.download_count,
    viewCount: row.view_count,
    fileChecksumSha256: row.file_checksum_sha256,
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedForReviewAt: row.submitted_for_review_at,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
  };
}

function toContentVersion(row: ContentVersionRow): ContentVersion {
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    versionNumber: row.version_number,
    fileName: row.file_name,
    fileFormat: row.file_format,
    fileSizeBytes: row.file_size_bytes,
    checksumSha256: row.checksum_sha256,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    uploadedByUserId: row.uploaded_by_user_id,
    uploadedByName: row.uploaded_by_name,
    uploadedAt: row.uploaded_at,
    changeNote: row.change_note,
  };
}

export async function getContentBySlug(slug: string): Promise<ContentItem | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('content_items').select('*').eq('slug', slug).maybeSingle();
  return data ? toContentItem(data) : undefined;
}

export async function getContentById(id: string): Promise<ContentItem | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('content_items').select('*').eq('id', id).maybeSingle();
  return data ? toContentItem(data) : undefined;
}

export async function getContentByIds(ids: string[]): Promise<ContentItem[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from('content_items').select('*').in('id', ids);
  return (data ?? []).map(toContentItem);
}

/** Every content item, unfiltered - for staff tooling (dashboard, library, review queue). */
export async function getAllContentItems(): Promise<ContentItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map(toContentItem);
}

export async function getVersionsForContent(contentItemId: string): Promise<ContentVersion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_versions')
    .select('*')
    .eq('content_item_id', contentItemId)
    .order('version_number', { ascending: false });
  return (data ?? []).map(toContentVersion);
}

export const CATEGORIES: string[] = [...CONTENT_CATEGORIES];
