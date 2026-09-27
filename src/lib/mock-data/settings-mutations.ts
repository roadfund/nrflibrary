'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from './audit-log';

export interface ActionResult {
  success: boolean;
  message: string;
}

const settingsSchema = z.object({
  maxUploadSizeMb: z.coerce.number().min(1).max(2000),
  requireInstitutionVerification: z.boolean(),
  supportEmail: z.string().email(),
  defaultAccessRequestDays: z.coerce.number().min(1).max(365),
});

export async function updatePlatformSettings(
  input: z.infer<typeof settingsSchema>,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Only a super admin can change platform settings.' };
  }

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid settings.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_settings')
    .update({
      max_upload_size_mb: parsed.data.maxUploadSizeMb,
      require_institution_verification: parsed.data.requireInstitutionVerification,
      support_email: parsed.data.supportEmail,
      default_access_request_days: parsed.data.defaultAccessRequestDays,
    })
    .eq('id', true);
  if (error) return { success: false, message: error.message };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'PLATFORM_SETTING_CHANGED',
    targetType: 'PlatformSetting',
    targetId: 'platform_settings',
    targetLabel: 'Platform settings',
    detail: 'Updated platform settings.',
  });

  revalidatePath('/staff/settings');
  return { success: true, message: 'Settings saved.' };
}
