import type { AccessLevel, ContentItem, ContentStatus, ContentType, FileFormat } from '@/lib/types';
import { getAllContentItems, getContentBySlug } from './content';
import { getPlanByCode } from './plans';
import { getSubscriptionByOwner } from './subscriptions';
import { countDownloadsInPeriod, getDownloadsForUsers } from './activity';
import { getMembersByInstitution } from './institutions';
import { getAccessRequestsForUsers } from './access-requests';
import { stripHtml } from '@/lib/html';
import type { AccessSubscription } from '@/lib/access-control';
import type { AccessRequest } from '@/lib/types';
import type { DownloadRecord } from '@/lib/types';

export type CatalogueSort = 'newest' | 'oldest' | 'title' | 'most_downloaded';

export interface CatalogueFilters {
  q?: string;
  contentType?: ContentType[];
  category?: string[];
  accessLevel?: AccessLevel[];
  fileFormat?: FileFormat[];
  geographicCoverage?: string;
  dateFrom?: string;
  dateTo?: string;
  featuredOnly?: boolean;
  sort?: CatalogueSort;
  page?: number;
  pageSize?: number;
}

export interface CatalogueResult {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
}

function matchesFilters(item: ContentItem, filters: CatalogueFilters): boolean {
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [
      item.title,
      stripHtml(item.shortDescription),
      stripHtml(item.fullDescription),
      item.category,
      item.authorOrSource,
      item.geographicCoverage,
      ...item.tags,
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.contentType?.length && !filters.contentType.includes(item.contentType)) return false;
  if (filters.category?.length && !filters.category.includes(item.category)) return false;
  if (filters.accessLevel?.length && !filters.accessLevel.includes(item.accessLevel)) return false;
  if (filters.fileFormat?.length && !filters.fileFormat.includes(item.fileFormat)) return false;
  if (
    filters.geographicCoverage &&
    !item.geographicCoverage.toLowerCase().includes(filters.geographicCoverage.toLowerCase())
  )
    return false;
  if (filters.dateFrom && item.datePublished < filters.dateFrom) return false;
  if (filters.dateTo && item.datePublished > filters.dateTo) return false;
  if (filters.featuredOnly && !item.isFeatured) return false;
  return true;
}

function sortItems(items: ContentItem[], sort: CatalogueSort = 'newest'): ContentItem[] {
  const sorted = [...items];
  switch (sort) {
    case 'oldest':
      return sorted.sort((a, b) => a.datePublished.localeCompare(b.datePublished));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'most_downloaded':
      return sorted.sort((a, b) => b.downloadCount - a.downloadCount);
    case 'newest':
    default:
      return sorted.sort((a, b) => b.datePublished.localeCompare(a.datePublished));
  }
}

/**
 * The public / subscriber catalogue. Always PUBLISHED, non-INTERNAL items -
 * this is intentionally distinct from getContentLibrary, which staff use to
 * manage every status including drafts and internal-only material.
 */
export async function getPublications(filters: CatalogueFilters = {}): Promise<CatalogueResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  const all = await getAllContentItems();
  const eligible = all.filter(
    (item) => item.status === 'PUBLISHED' && item.accessLevel !== 'INTERNAL',
  );
  const filtered = eligible.filter((item) => matchesFilters(item, filters));
  const sorted = sortItems(filtered, filters.sort);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total: sorted.length, page, pageSize };
}

export interface ContentLibraryFilters extends CatalogueFilters {
  status?: ContentStatus[];
  ownerUserId?: string;
}

/** Staff-only view across every status and access level, including INTERNAL. */
export async function getContentLibrary(
  filters: ContentLibraryFilters = {},
): Promise<CatalogueResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  let eligible = await getAllContentItems();
  if (filters.status?.length) {
    eligible = eligible.filter((item) => filters.status!.includes(item.status));
  }
  if (filters.ownerUserId) {
    eligible = eligible.filter((item) => item.ownerUserId === filters.ownerUserId);
  }
  const filtered = eligible.filter((item) => matchesFilters(item, filters));
  const sorted = sortItems(filtered, filters.sort);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total: sorted.length, page, pageSize };
}

export async function getReviewQueue(): Promise<ContentItem[]> {
  const all = await getAllContentItems();
  return all
    .filter((item) => item.status === 'IN_REVIEW')
    .sort((a, b) => (a.submittedForReviewAt ?? '').localeCompare(b.submittedForReviewAt ?? ''));
}

export async function getPublicationBySlug(slug: string): Promise<ContentItem | null> {
  return (await getContentBySlug(slug)) ?? null;
}

export async function getRelatedPublications(item: ContentItem): Promise<ContentItem[]> {
  if (item.relatedItemIds.length === 0) return [];
  const all = await getAllContentItems();
  return all.filter(
    (candidate) => item.relatedItemIds.includes(candidate.id) && candidate.status === 'PUBLISHED',
  );
}

export interface ViewerSubscriptionResult {
  subscription: AccessSubscription | null;
  raw: Awaited<ReturnType<typeof getSubscriptionByOwner>>;
}

/**
 * Resolves the effective subscription for a viewer: their own individual
 * subscription, or their institution's, whichever applies. Returns null
 * when there is no subscription record at all (distinct from an inactive
 * one) so callers can tell "never subscribed" from "subscription lapsed".
 */
export async function getViewerSubscription(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
  userIdForDownloadCount: string,
): Promise<ViewerSubscriptionResult> {
  const raw = await getSubscriptionByOwner(ownerType, ownerId);
  if (!raw) return { subscription: null, raw: undefined };

  const [plan, downloadsUsedThisPeriod] = await Promise.all([
    getPlanByCode(raw.planCode),
    countDownloadsInPeriod(userIdForDownloadCount, raw.currentPeriodStart, raw.currentPeriodEnd),
  ]);

  return {
    subscription: {
      status: raw.status,
      planCode: raw.planCode,
      downloadLimitPerMonth: plan?.downloadLimitPerMonth ?? null,
      downloadsUsedThisPeriod,
    },
    raw,
  };
}

export interface InstitutionUsage {
  totalDownloads: number;
  totalAccessRequests: number;
  byMember: { userId: string; name: string; downloads: number }[];
  recentDownloads: DownloadRecord[];
  recentAccessRequests: AccessRequest[];
}

/** Aggregates activity across every member of an institution. */
export async function getInstitutionUsage(institutionId: string): Promise<InstitutionUsage> {
  const allMembers = await getMembersByInstitution(institutionId);
  const members = allMembers.filter((member) => member.userId);
  const memberIds = members.map((member) => member.userId!);

  const [relevantDownloads, relevantRequests] = await Promise.all([
    getDownloadsForUsers(memberIds),
    getAccessRequestsForUsers(memberIds),
  ]);

  const byMember = members.map((member) => ({
    userId: member.userId!,
    name: member.name ?? member.email,
    downloads: relevantDownloads.filter((record) => record.userId === member.userId).length,
  }));

  return {
    totalDownloads: relevantDownloads.length,
    totalAccessRequests: relevantRequests.length,
    byMember,
    recentDownloads: relevantDownloads
      .slice()
      .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
      .slice(0, 10),
    recentAccessRequests: relevantRequests
      .slice()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10),
  };
}
