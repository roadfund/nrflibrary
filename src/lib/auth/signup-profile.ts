import 'server-only';
import type { User as AuthUser } from '@supabase/supabase-js';
import { z } from 'zod';
import type { createClient } from '@/lib/supabase/server';
import { ACCOUNT_TYPES } from '@/lib/validation/account';
import { INSTITUTION_TYPES } from '@/lib/types/institution';
import type { User } from '@/lib/types';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const signupDetailsSchema = z.object({
  accountType: z.enum(ACCOUNT_TYPES),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  organization: z.string().max(200).optional(),
  fieldOfStudy: z.string().max(120).optional(),
  institutionName: z.string().max(200).optional(),
  institutionType: z.enum(INSTITUTION_TYPES).optional(),
  institutionCountry: z.string().max(100).optional(),
});

export type SignupDetails = z.infer<typeof signupDetailsSchema>;

export async function createProfileRecords(
  supabase: SupabaseClient,
  userId: string,
  data: SignupDetails,
): Promise<{ role: User['role'] } | { error: string }> {
  let institutionId: string | null = null;
  let role: User['role'] = data.accountType === 'RESEARCHER' ? 'RESEARCHER' : 'STUDENT';

  if (data.accountType === 'INSTITUTION') {
    role = 'INSTITUTION_ADMIN';
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .insert({
        name: data.institutionName!,
        type: data.institutionType!,
        country: data.institutionCountry!,
      })
      .select('id')
      .single();
    if (institutionError || !institution) {
      return { error: institutionError?.message ?? 'Could not register your institution.' };
    }
    institutionId = institution.id;

    const { error: memberError } = await supabase.from('institution_members').insert({
      institution_id: institutionId,
      user_id: userId,
      email: data.email,
      name: data.name,
      role: 'INSTITUTION_ADMIN',
      status: 'ACTIVE',
      joined_at: new Date().toISOString(),
    });
    if (memberError) {
      return { error: memberError.message };
    }
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email: data.email,
    name: data.name,
    role,
    institution_id: institutionId,
    organization:
      data.accountType === 'INSTITUTION' ? data.institutionName! : (data.organization ?? null),
    field_of_study: data.fieldOfStudy ?? null,
  });
  if (profileError) {
    return { error: profileError.message };
  }

  return { role };
}

export async function ensureProfileFromSignup(
  supabase: SupabaseClient,
  user: AuthUser,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return true;

  const parsed = signupDetailsSchema.safeParse(user.user_metadata?.signup);
  if (!parsed.success) return false;

  const result = await createProfileRecords(supabase, user.id, {
    ...parsed.data,
    email: user.email ?? parsed.data.email,
  });
  return 'role' in result;
}
