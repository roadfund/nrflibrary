'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getPlanById } from './plans';
import { logAudit } from './audit-log';

export interface ActionResult {
  success: boolean;
  message: string;
}

const updatePlanSchema = z.object({
  planId: z.string().min(1),
  monthlyPrice: z.coerce.number().min(0),
  annualPrice: z.coerce.number().min(0),
  downloadLimitPerMonth: z.coerce.number().min(0).nullable(),
  active: z.boolean(),
});

export async function updatePlan(input: z.infer<typeof updatePlanSchema>): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Only a super admin can change plan pricing.' };
  }

  const parsed = updatePlanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid plan details.' };
  }

  const plan = await getPlanById(parsed.data.planId);
  if (!plan) return { success: false, message: 'Plan not found.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('plans')
    .update({
      monthly_price: parsed.data.monthlyPrice,
      annual_price: parsed.data.annualPrice,
      download_limit_per_month: parsed.data.downloadLimitPerMonth,
      active: parsed.data.active,
    })
    .eq('id', plan.id);
  if (error) return { success: false, message: error.message };

  await logAudit({
    actorId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: 'PLATFORM_SETTING_CHANGED',
    targetType: 'Plan',
    targetId: plan.id,
    targetLabel: plan.name,
    detail: `Updated pricing: $${parsed.data.monthlyPrice}/mo, $${parsed.data.annualPrice}/yr.`,
  });

  revalidatePath('/staff/plans');
  revalidatePath('/pricing');
  return { success: true, message: `${plan.name} plan updated.` };
}
