'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { INSTITUTION_TYPES } from '@/lib/types/institution';

export interface ActionResult {
  success: boolean;
  message: string;
}

const profileSchema = z.object({
  institutionId: z.string().min(1),
  name: z.string().min(2, 'Enter an institution name.').max(200),
  type: z.enum(INSTITUTION_TYPES),
  country: z.string().min(2, 'Enter a country.').max(100),
  website: z.string().url('Enter a valid URL.').or(z.literal('')).optional(),
});

export async function updateInstitutionProfile(
  input: z.infer<typeof profileSchema>,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.user.role !== 'INSTITUTION_ADMIN') {
    return { success: false, message: 'Only an institution administrator can update this.' };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid details.' };
  }
  if (parsed.data.institutionId !== session.user.institutionId) {
    return { success: false, message: 'You can only update your own institution.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('institutions')
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      country: parsed.data.country,
      website: parsed.data.website || null,
    })
    .eq('id', parsed.data.institutionId);

  if (error) return { success: false, message: error.message };

  revalidatePath('/institution/profile');
  revalidatePath('/dashboard');
  return { success: true, message: 'Institution profile updated.' };
}

const inviteSchema = z.object({
  institutionId: z.string().min(1),
  email: z.string().email('Enter a valid email address.'),
  role: z.enum(['INSTITUTION_ADMIN', 'INSTITUTION_MEMBER']),
});

export async function inviteInstitutionMember(
  input: z.infer<typeof inviteSchema>,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.user.role !== 'INSTITUTION_ADMIN') {
    return { success: false, message: 'Only an institution administrator can invite members.' };
  }

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid invite.' };
  }
  if (parsed.data.institutionId !== session.user.institutionId) {
    return { success: false, message: 'You can only invite members to your own institution.' };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('institution_members')
    .select('id')
    .eq('institution_id', parsed.data.institutionId)
    .eq('email', parsed.data.email)
    .maybeSingle();
  if (existing) {
    return { success: false, message: 'This email has already been invited.' };
  }

  const { error } = await supabase.from('institution_members').insert({
    institution_id: parsed.data.institutionId,
    email: parsed.data.email,
    role: parsed.data.role,
    status: 'INVITED',
  });
  if (error) return { success: false, message: error.message };

  revalidatePath('/institution/members');
  return { success: true, message: `Invitation sent to ${parsed.data.email}.` };
}

export async function removeInstitutionMember(memberId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.user.role !== 'INSTITUTION_ADMIN') {
    return { success: false, message: 'Only an institution administrator can remove members.' };
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('institution_members')
    .select('institution_id')
    .eq('id', memberId)
    .maybeSingle();

  if (!member) return { success: false, message: 'Member not found.' };
  if (member.institution_id !== session.user.institutionId) {
    return { success: false, message: 'You can only manage your own institution.' };
  }

  const { error } = await supabase
    .from('institution_members')
    .update({ status: 'REMOVED' })
    .eq('id', memberId);
  if (error) return { success: false, message: error.message };

  revalidatePath('/institution/members');
  return { success: true, message: 'Member removed.' };
}
