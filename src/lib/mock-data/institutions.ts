import { createClient } from '@/lib/supabase/server';
import type { Institution, InstitutionMember } from '@/lib/types';

function toInstitution(row: {
  id: string;
  name: string;
  type: Institution['type'];
  country: string;
  website: string | null;
  verified: boolean;
  verified_at: string | null;
  subscription_id: string | null;
  created_at: string;
}): Institution {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    country: row.country,
    website: row.website,
    verified: row.verified,
    verifiedAt: row.verified_at,
    subscriptionId: row.subscription_id,
    createdAt: row.created_at,
  };
}

function toMember(row: {
  id: string;
  institution_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  role: InstitutionMember['role'];
  status: InstitutionMember['status'];
  invited_at: string;
  joined_at: string | null;
}): InstitutionMember {
  return {
    id: row.id,
    institutionId: row.institution_id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
  };
}

export async function getAllInstitutions(): Promise<Institution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('institutions')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map(toInstitution);
}

export async function getInstitutionById(id: string): Promise<Institution | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('institutions').select('*').eq('id', id).maybeSingle();
  return data ? toInstitution(data) : undefined;
}

export async function getMembersByInstitution(institutionId: string): Promise<InstitutionMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('institution_members')
    .select('*')
    .eq('institution_id', institutionId)
    .order('invited_at', { ascending: true });
  return (data ?? []).map(toMember);
}
