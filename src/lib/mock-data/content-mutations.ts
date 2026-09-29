'use server';

import { revalidatePath } from 'next/cache';
import { newId } from '@/lib/ids';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isStaffRole } from '@/lib/types/roles';
import { contentDraftSchema, type ContentDraftInput } from '@/lib/validation/content';
import { logAudit } from './audit-log';
import type { AuditAction, ContentStatus } from '@/lib/types';
import type { UploadedContentFile } from '@/lib/upload/upload-content-file';

export interface ActionResult {
  success: boolean;
  message: string;
  id?: string;
  slug?: string;
}

function fakeChecksum(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  let slug = base;
  let suffix = 2;
  for (;;) {
    const { data } = await supabase
      .from('content_items')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createContentDraft(
  input: ContentDraftInput,
  publish = false,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can create content.' };
  }

  const parsed = contentDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the form for errors.',
    };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const id = newId('c');
  const slug = await uniqueSlug(supabase, data.title);
  const now = new Date().toISOString();
  // A real checksum means a file was actually uploaded via uploadContentFile()
  // first; content types like DASHBOARD_LINK have no file at all.
  const checksum = data.checksumSha256 ?? fakeChecksum();
  const storageBucket = data.storageBucket ?? null;
  const storagePath = data.storagePath ?? null;
  const tags = data.tags
    ? data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error } = await supabase.from('content_items').insert({
    id,
    slug,
    title: data.title,
    short_description: data.shortDescription,
    full_description: data.fullDescription,
    content_type: data.contentType,
    category: data.category,
    tags,
    author_or_source: data.authorOrSource,
    geographic_coverage: data.geographicCoverage,
    date_published: data.datePublished,
    date_collected: data.dateCollected || null,
    file_format: data.fileFormat,
    file_size_bytes: data.fileSizeBytes ?? 0,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    external_url: data.externalUrl?.trim() || null,
    license_terms: data.licenseTerms,
    access_level: data.accessLevel,
    allowed_plan_codes: data.allowedPlanCodes,
    is_featured: data.isFeatured,
    status: publish ? 'PUBLISHED' : 'DRAFT',
    file_checksum_sha256: checksum,
    owner_user_id: session.user.id,
    owner_name: session.user.name,
    published_at: publish ? now : null,
  });
  if (error) return { success: false, message: error.message };

  if (data.fileName) {
    const { error: versionError } = await supabase.from('content_versions').insert({
      id: `v_${id}_1`,
      content_item_id: id,
      version_number: 1,
      file_name: data.fileName,
      file_format: data.fileFormat,
      file_size_bytes: data.fileSizeBytes ?? 0,
      checksum_sha256: checksum,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      uploaded_by_user_id: session.user.id,
      uploaded_by_name: session.user.name,
      change_note: 'Initial upload.',
    });
    if (versionError) return { success: false, message: versionError.message };
  }

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_CREATED',
    targetType: 'ContentItem',
    targetId: id,
    targetLabel: data.title,
    detail: publish ? 'Created and published directly.' : 'Created as draft.',
  });
  if (publish) {
    await logAudit({
      actorId: session.user.id,
      actorName: session.user.name,
      actorRole: session.user.role,
      action: 'CONTENT_PUBLISHED',
      targetType: 'ContentItem',
      targetId: id,
      targetLabel: data.title,
      detail: `Published as ${data.accessLevel}.`,
    });
  }
  revalidatePath('/staff/library');
  if (publish) revalidatePath('/catalogue');
  return { success: true, message: publish ? 'Published.' : 'Draft created.', id, slug };
}

export async function updateContentMetadata(
  id: string,
  input: ContentDraftInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can edit content.' };
  }

  const parsed = contentDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the form for errors.',
    };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('content_items')
    .update({
      title: data.title,
      short_description: data.shortDescription,
      full_description: data.fullDescription,
      content_type: data.contentType,
      category: data.category,
      tags: data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      author_or_source: data.authorOrSource,
      geographic_coverage: data.geographicCoverage,
      date_published: data.datePublished,
      date_collected: data.dateCollected || null,
      external_url: data.externalUrl?.trim() || null,
      license_terms: data.licenseTerms,
      access_level: data.accessLevel,
      allowed_plan_codes: data.allowedPlanCodes,
      is_featured: data.isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, title, slug')
    .single();
  if (error || !item)
    return { success: false, message: error?.message ?? 'Content item not found.' };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_UPDATED',
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: 'Metadata updated.',
  });
  revalidatePath(`/staff/library/${id}`);
  revalidatePath('/staff/library');
  revalidatePath(`/catalogue/${item.slug}`);
  return { success: true, message: 'Changes saved.' };
}

export async function replaceContentFile(
  id: string,
  file: UploadedContentFile,
  changeNote: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can replace files.' };
  }
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('content_items')
    .select('version_number')
    .eq('id', id)
    .maybeSingle();
  if (!current) return { success: false, message: 'Content item not found.' };

  const newVersion = current.version_number + 1;
  const now = new Date().toISOString();

  const { error: versionError } = await supabase.from('content_versions').insert({
    id: `v_${id}_${newVersion}`,
    content_item_id: id,
    version_number: newVersion,
    file_name: file.fileName,
    file_format: file.fileFormat,
    file_size_bytes: file.fileSizeBytes,
    checksum_sha256: file.checksumSha256,
    storage_bucket: file.storageBucket,
    storage_path: file.storagePath,
    uploaded_by_user_id: session.user.id,
    uploaded_by_name: session.user.name,
    change_note: changeNote || 'File replaced.',
  });
  if (versionError) return { success: false, message: versionError.message };

  const { data: item, error } = await supabase
    .from('content_items')
    .update({
      version_number: newVersion,
      file_format: file.fileFormat,
      file_size_bytes: file.fileSizeBytes,
      file_checksum_sha256: file.checksumSha256,
      storage_bucket: file.storageBucket,
      storage_path: file.storagePath,
      updated_at: now,
    })
    .eq('id', id)
    .select('id, title')
    .single();
  if (error || !item)
    return { success: false, message: error?.message ?? 'Content item not found.' };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_FILE_REPLACED',
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: `Replaced file with version ${newVersion}.`,
  });
  revalidatePath(`/staff/library/${id}`);
  return { success: true, message: `File replaced. Now on version ${newVersion}.` };
}

export async function submitForReview(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can submit content for review.' };
  }
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: item, error } = await supabase
    .from('content_items')
    .update({ status: 'IN_REVIEW', submitted_for_review_at: now, updated_at: now })
    .eq('id', id)
    .in('status', ['DRAFT', 'CHANGES_REQUESTED'])
    .select('id, title')
    .maybeSingle();
  if (error) return { success: false, message: error.message };
  if (!item)
    return {
      success: false,
      message: 'Only drafts or items with requested changes can be submitted.',
    };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_SUBMITTED_FOR_REVIEW',
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: 'Submitted for review.',
  });
  revalidatePath(`/staff/library/${id}`);
  revalidatePath('/staff/review');
  return { success: true, message: 'Submitted for review.' };
}

/** Publishes a draft directly, skipping the review queue - for content that doesn't need a second set of eyes before going live. */
export async function publishContentDraft(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can publish content.' };
  }
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: item, error } = await supabase
    .from('content_items')
    .update({ status: 'PUBLISHED', published_at: now, updated_at: now })
    .eq('id', id)
    .in('status', ['DRAFT', 'CHANGES_REQUESTED'])
    .select('id, title, access_level')
    .maybeSingle();
  if (error) return { success: false, message: error.message };
  if (!item)
    return {
      success: false,
      message: 'Only drafts or items with requested changes can be published directly.',
    };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_PUBLISHED',
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: `Published directly as ${item.access_level}.`,
  });
  revalidatePath(`/staff/library/${id}`);
  revalidatePath('/staff/library');
  revalidatePath('/staff/review');
  revalidatePath('/catalogue');
  return { success: true, message: 'Published.' };
}

export type ReviewDecision = 'APPROVE' | 'CHANGES_REQUESTED' | 'REJECT';

export async function decideContentReview(
  id: string,
  decision: ReviewDecision,
  note: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can review content.' };
  }
  if (session.user.role === 'PUBLISHER' && !session.user.isReviewer) {
    return { success: false, message: 'You do not have reviewer permission.' };
  }
  const supabase = await createClient();
  const now = new Date().toISOString();

  const statusByDecision: Record<ReviewDecision, ContentStatus> = {
    APPROVE: 'PUBLISHED',
    CHANGES_REQUESTED: 'CHANGES_REQUESTED',
    REJECT: 'REJECTED',
  };

  const { data: item, error } = await supabase
    .from('content_items')
    .update({
      reviewer_id: session.user.id,
      reviewer_name: session.user.name,
      review_note: note || null,
      status: statusByDecision[decision],
      published_at: decision === 'APPROVE' ? now : undefined,
      updated_at: now,
    })
    .eq('id', id)
    .eq('status', 'IN_REVIEW')
    .select('id, title, access_level')
    .maybeSingle();
  if (error) return { success: false, message: error.message };
  if (!item) return { success: false, message: 'Only items in review can be decided.' };

  const actionByDecision: Record<ReviewDecision, AuditAction> = {
    APPROVE: 'CONTENT_APPROVED',
    CHANGES_REQUESTED: 'CONTENT_CHANGES_REQUESTED',
    REJECT: 'CONTENT_REJECTED',
  };
  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: actionByDecision[decision],
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: note || decision,
  });
  if (decision === 'APPROVE') {
    await logAudit({
      actorId: session.user.id,
      actorName: session.user.name,
      actorRole: session.user.role,
      action: 'CONTENT_PUBLISHED',
      targetType: 'ContentItem',
      targetId: item.id,
      targetLabel: item.title,
      detail: `Published as ${item.access_level}.`,
    });
  }

  revalidatePath(`/staff/library/${id}`);
  revalidatePath('/staff/review');
  revalidatePath('/staff/library');
  revalidatePath('/catalogue');
  return {
    success: true,
    message: `Content ${decision === 'APPROVE' ? 'approved and published' : decision === 'REJECT' ? 'rejected' : 'sent back for changes'}.`,
  };
}

export async function archiveContentItem(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can archive content.' };
  }
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: item, error } = await supabase
    .from('content_items')
    .update({ status: 'ARCHIVED', archived_at: now, updated_at: now })
    .eq('id', id)
    .select('id, title')
    .single();
  if (error || !item)
    return { success: false, message: error?.message ?? 'Content item not found.' };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_ARCHIVED',
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: 'Archived.',
  });
  revalidatePath(`/staff/library/${id}`);
  revalidatePath('/staff/library');
  revalidatePath('/catalogue');
  return { success: true, message: 'Content archived.' };
}

export async function restoreContentItem(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can restore content.' };
  }
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('content_items')
    .update({ status: 'PUBLISHED', archived_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'ARCHIVED')
    .select('id, title')
    .maybeSingle();
  if (error || !item) {
    return { success: false, message: error?.message ?? 'Only archived content can be restored.' };
  }

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_RESTORED',
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: 'Restored from archive and republished.',
  });
  revalidatePath(`/staff/library/${id}`);
  revalidatePath('/staff/library');
  revalidatePath('/catalogue');
  return { success: true, message: 'Content restored to the catalogue.' };
}

export async function deleteContentItem(id: string, confirmTitle?: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can delete content.' };
  }
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('content_items')
    .select('id, title, status, storage_bucket, storage_path')
    .eq('id', id)
    .maybeSingle();
  if (!item) return { success: false, message: 'Content item not found.' };

  const wasPublished = item.status === 'PUBLISHED' || item.status === 'ARCHIVED';
  if (wasPublished && session.user.role !== 'SUPER_ADMIN') {
    return {
      success: false,
      message: 'Only a super admin can delete published or archived content. Archive it instead.',
    };
  }
  if (wasPublished && confirmTitle?.trim() !== item.title.trim()) {
    return { success: false, message: 'Type the exact title to confirm deletion.' };
  }

  const { data: versions } = await supabase
    .from('content_versions')
    .select('storage_bucket, storage_path')
    .eq('content_item_id', id);

  const filesByBucket = new Map<string, Set<string>>();
  for (const file of [item, ...(versions ?? [])]) {
    if (!file.storage_bucket || !file.storage_path) continue;
    const paths = filesByBucket.get(file.storage_bucket) ?? new Set<string>();
    paths.add(file.storage_path);
    filesByBucket.set(file.storage_bucket, paths);
  }

  const { data: deleted, error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id)
    .select('id');
  if (error || !deleted?.length) {
    return { success: false, message: error?.message ?? 'Could not delete this content.' };
  }

  let fileCleanupFailed = false;
  for (const [bucket, paths] of filesByBucket) {
    const { error: storageError } = await supabase.storage.from(bucket).remove([...paths]);
    if (storageError) fileCleanupFailed = true;
  }

  const fileCount = [...filesByBucket.values()].reduce((n, paths) => n + paths.size, 0);
  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'CONTENT_DELETED',
    targetType: 'ContentItem',
    targetId: item.id,
    targetLabel: item.title,
    detail: `Permanently deleted (was ${item.status.toLowerCase().replace('_', ' ')}) with ${fileCount} stored file${fileCount === 1 ? '' : 's'}${fileCleanupFailed ? '; some files could not be removed from storage' : ''}.`,
  });
  revalidatePath('/staff/library');
  revalidatePath('/staff/review');
  revalidatePath('/catalogue');
  return {
    success: true,
    message: fileCleanupFailed
      ? 'Content deleted, but some stored files could not be removed.'
      : 'Content deleted.',
  };
}

export type AccessRequestDecision = 'APPROVE' | 'DECLINE' | 'NEEDS_INFO';

export async function decideAccessRequest(
  requestId: string,
  decision: AccessRequestDecision,
  note: string,
  accessDays?: number,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) {
    return { success: false, message: 'Only Road Fund staff can decide access requests.' };
  }
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('access_requests')
    .select('requested_access_days')
    .eq('id', requestId)
    .maybeSingle();
  if (!existing) return { success: false, message: 'Access request not found.' };

  const statusByDecision: Record<AccessRequestDecision, 'APPROVED' | 'DECLINED' | 'NEEDS_INFO'> = {
    APPROVE: 'APPROVED',
    DECLINE: 'DECLINED',
    NEEDS_INFO: 'NEEDS_INFO',
  };
  const accessExpiresAt =
    decision === 'APPROVE'
      ? new Date(
          Date.now() + (accessDays ?? existing.requested_access_days) * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null;

  const { data: request, error } = await supabase
    .from('access_requests')
    .update({
      reviewer_id: session.user.id,
      reviewer_name: session.user.name,
      review_note: note || null,
      decided_at: new Date().toISOString(),
      status: statusByDecision[decision],
      access_expires_at: accessExpiresAt,
    })
    .eq('id', requestId)
    .select('id, user_name, content_title')
    .single();
  if (error || !request)
    return { success: false, message: error?.message ?? 'Access request not found.' };

  const actionByDecision: Record<AccessRequestDecision, AuditAction> = {
    APPROVE: 'ACCESS_REQUEST_APPROVED',
    DECLINE: 'ACCESS_REQUEST_DECLINED',
    NEEDS_INFO: 'ACCESS_REQUEST_NEEDS_INFO',
  };
  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: actionByDecision[decision],
    targetType: 'AccessRequest',
    targetId: request.id,
    targetLabel: `${request.user_name} — ${request.content_title}`,
    detail: note || decision,
  });

  revalidatePath('/staff/requests');
  revalidatePath('/requests');
  revalidatePath('/institution/activity');
  return { success: true, message: 'Decision recorded.' };
}
