import { createClient } from '@/lib/supabase/server';
import type { DownloadRecord, SavedItem } from '@/lib/types';

function toSavedItem(row: {
  id: string;
  user_id: string;
  content_item_id: string;
  saved_at: string;
}): SavedItem {
  return {
    id: row.id,
    userId: row.user_id,
    contentItemId: row.content_item_id,
    savedAt: row.saved_at,
  };
}

function toDownloadRecord(row: {
  id: string;
  user_id: string;
  content_item_id: string | null;
  content_title: string;
  version_number: number;
  downloaded_at: string;
}): DownloadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    contentItemId: row.content_item_id,
    contentTitle: row.content_title,
    versionNumber: row.version_number,
    downloadedAt: row.downloaded_at,
  };
}

export async function getSavedItemsForUser(userId: string): Promise<SavedItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  return (data ?? []).map(toSavedItem);
}

export async function isItemSaved(userId: string, contentItemId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', userId)
    .eq('content_item_id', contentItemId)
    .maybeSingle();
  return Boolean(data);
}

export async function getDownloadsForUser(userId: string): Promise<DownloadRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('download_records')
    .select('*')
    .eq('user_id', userId)
    .order('downloaded_at', { ascending: false });
  return (data ?? []).map(toDownloadRecord);
}

export async function getDownloadsForUsers(userIds: string[]): Promise<DownloadRecord[]> {
  if (userIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from('download_records').select('*').in('user_id', userIds);
  return (data ?? []).map(toDownloadRecord);
}

export async function countDownloadsInPeriod(
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('download_records')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('downloaded_at', periodStart)
    .lte('downloaded_at', periodEnd);
  return count ?? 0;
}
