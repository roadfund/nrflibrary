import { createClient } from '@/lib/supabase/server';
import type { AccessRequest } from '@/lib/types';

function toAccessRequest(row: {
  id: string;
  content_item_id: string;
  content_title: string;
  user_id: string;
  user_name: string;
  purpose: string;
  institution: string;
  intended_use: string;
  requested_access_days: number;
  status: AccessRequest['status'];
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_note: string | null;
  submitted_at: string;
  decided_at: string | null;
  access_expires_at: string | null;
}): AccessRequest {
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    contentTitle: row.content_title,
    userId: row.user_id,
    userName: row.user_name,
    purpose: row.purpose,
    institution: row.institution,
    intendedUse: row.intended_use,
    requestedAccessDays: row.requested_access_days,
    status: row.status,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    accessExpiresAt: row.access_expires_at,
  };
}

export async function getAllAccessRequests(): Promise<AccessRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('access_requests')
    .select('*')
    .order('submitted_at', { ascending: false });
  return (data ?? []).map(toAccessRequest);
}

export async function getAccessRequestsForUser(userId: string): Promise<AccessRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('access_requests')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });
  return (data ?? []).map(toAccessRequest);
}

export async function getAccessRequestsForUsers(userIds: string[]): Promise<AccessRequest[]> {
  if (userIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from('access_requests').select('*').in('user_id', userIds);
  return (data ?? []).map(toAccessRequest);
}

export async function hasApprovedAccessGrant(
  userId: string,
  contentItemId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('access_requests')
    .select('access_expires_at')
    .eq('user_id', userId)
    .eq('content_item_id', contentItemId)
    .eq('status', 'APPROVED')
    .maybeSingle();
  return Boolean(
    data?.access_expires_at && new Date(data.access_expires_at).getTime() > Date.now(),
  );
}
