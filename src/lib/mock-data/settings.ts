import { createClient } from '@/lib/supabase/server';

export interface PlatformSettings {
  maxUploadSizeMb: number;
  requireInstitutionVerification: boolean;
  supportEmail: string;
  defaultAccessRequestDays: number;
}

const DEFAULTS: PlatformSettings = {
  maxUploadSizeMb: 250,
  requireInstitutionVerification: true,
  supportEmail: 'info@nrf.gov.lr',
  defaultAccessRequestDays: 30,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle();
  if (!data) return DEFAULTS;

  return {
    maxUploadSizeMb: data.max_upload_size_mb,
    requireInstitutionVerification: data.require_institution_verification,
    supportEmail: data.support_email,
    defaultAccessRequestDays: data.default_access_request_days,
  };
}
