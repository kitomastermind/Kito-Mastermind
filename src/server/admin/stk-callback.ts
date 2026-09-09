import { supabaseAdmin } from '@/server/admin/client';
import { parseStkCallback } from '@/server/services/mpesa';
import { deliverNotification } from '@/server/admin/notify';
import { notificationCopy } from '@/server/services/notification-copy';
import type { Json } from '@/lib/types/database';

export async function applyStkCallback(raw: Record<string, unknown>): Promise<{ contributionId: string | null }> {
  const parsed = parseStkCallback(raw);
  const { data, error } = await supabaseAdmin.rpc('complete_stk_payment', {
    p_checkout_request_id: parsed.checkoutRequestId,
    p_receipt: parsed.receipt ?? '',
    p_result_code: parsed.resultCode,
    p_result_desc: parsed.resultDesc,
    p_raw: raw as Json,
  });
  if (error) throw error;
  if (parsed.resultCode === 0 && data) {
    const { data: contribution } = await supabaseAdmin
      .from('contributions')
      .select('profile_id')
      .eq('id', data)
      .maybeSingle();
    if (contribution?.profile_id) {
      await deliverNotification({
        profileId: contribution.profile_id,
        type: 'CONTRIBUTION_RECEIVED',
        copy: notificationCopy('CONTRIBUTION_RECEIVED', { otherName: 'Chapter' }),
      });
    }
  }
  return { contributionId: data ?? null };
}
