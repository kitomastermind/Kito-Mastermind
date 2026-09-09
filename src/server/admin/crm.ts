import { supabaseAdmin } from '@/server/admin/client';
import { decryptSecret, encryptSecret } from '@/server/admin/crm-crypto';

export async function storeCrmToken(profileId: string, token: string): Promise<void> {
  const { error } = await supabaseAdmin.from('crm_connections').upsert({
    profile_id: profileId,
    provider: 'FOLLOW_UP_BOSS',
    access_token_enc: encryptSecret(token),
    connected: true,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'profile_id,provider' });
  if (error) throw error;
}

export async function readCrmToken(profileId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('crm_connections')
    .select('access_token_enc')
    .eq('profile_id', profileId)
    .eq('provider', 'FOLLOW_UP_BOSS')
    .maybeSingle();
  if (error) throw error;
  if (!data?.access_token_enc) return null;
  return decryptSecret(data.access_token_enc);
}
