import { createClient } from '@/lib/supabase/server';
import type { Plan, PlanCode } from '@/lib/types';

function toPlan(row: {
  id: string;
  code: Plan['code'];
  name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  currency: string;
  seat_based: boolean;
  min_seats: number | null;
  download_limit_per_month: number | null;
  eligible_roles: string[];
  features: string[];
  active: boolean;
}): Plan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    monthlyPrice: row.monthly_price,
    annualPrice: row.annual_price,
    currency: row.currency,
    seatBased: row.seat_based,
    minSeats: row.min_seats,
    downloadLimitPerMonth: row.download_limit_per_month,
    eligibleRoles: row.eligible_roles,
    features: row.features,
    active: row.active,
  };
}

export async function getAllPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('plans')
    .select('*')
    .order('monthly_price', { ascending: true });
  return (data ?? []).map(toPlan);
}

export async function getPlanByCode(code: PlanCode): Promise<Plan | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('plans').select('*').eq('code', code).maybeSingle();
  return data ? toPlan(data) : undefined;
}

export async function getPlanById(id: string): Promise<Plan | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from('plans').select('*').eq('id', id).maybeSingle();
  return data ? toPlan(data) : undefined;
}
