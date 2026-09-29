import { createClient } from '@/lib/supabase/server';
import { newId } from '@/lib/ids';
import type { AuditAction, AuditLogEntry } from '@/lib/types';

function toEntry(row: {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  target_label: string;
  detail: string;
  created_at: string;
}): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_log_entries')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map(toEntry);
}

export async function logAudit(entry: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  targetLabel: string;
  detail: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('audit_log_entries').insert({
    id: newId('audit'),
    actor_id: entry.actorId,
    actor_name: entry.actorName,
    actor_role: entry.actorRole,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId,
    target_label: entry.targetLabel,
    detail: entry.detail,
  });
  if (error) console.error('Audit log write failed.');
}
