import { createClient } from '@/lib/supabase/server';
import type { User } from '@/lib/types';

function toUser(row: {
  id: string;
  email: string;
  name: string;
  role: User['role'];
  is_reviewer: boolean;
  institution_id: string | null;
  organization: string | null;
  field_of_study: string | null;
  active: boolean;
  created_at: string;
  last_login_at: string | null;
  email_verified_at: string | null;
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isReviewer: row.is_reviewer,
    institutionId: row.institution_id,
    organization: row.organization,
    fieldOfStudy: row.field_of_study,
    emailVerified: Boolean(row.email_verified_at),
    active: row.active,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

export async function getAllProfiles(): Promise<User[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').order('name', { ascending: true });
  return (data ?? []).map(toUser);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data ? toUser(data) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').ilike('email', email).maybeSingle();
  return data ? toUser(data) : undefined;
}
