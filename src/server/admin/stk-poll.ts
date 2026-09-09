import { supabaseAdmin } from '@/server/admin/client';
import { applyStkCallback } from '@/server/admin/stk-callback';
import { mpesaEnabled, stkQuery } from '@/server/services/mpesa';
import { logger } from '@/lib/logger';

export async function pollDroppedStk(now = new Date()): Promise<{ recovered: number }> {
  if (!mpesaEnabled()) return { recovered: 0 };
  const cutoff = new Date(now.getTime() - 60_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('mpesa_payments')
    .select('checkout_request_id')
    .is('completed_at', null)
    .not('checkout_request_id', 'is', null)
    .lt('created_at', cutoff)
    .limit(20);
  if (error) throw error;
  let recovered = 0;
  for (const row of data ?? []) {
    if (!row.checkout_request_id) continue;
    try {
      const result = await stkQuery(row.checkout_request_id);
      await applyStkCallback({
        Body: {
          stkCallback: {
            CheckoutRequestID: row.checkout_request_id,
            ResultCode: result.resultCode,
            ResultDesc: result.resultDesc,
            CallbackMetadata: result.receipt
              ? { Item: [{ Name: 'MpesaReceiptNumber', Value: result.receipt }] }
              : undefined,
          },
        },
      });
      recovered += 1;
    } catch (caught) {
      logger.warn('stk-poll-failed', { message: caught instanceof Error ? caught.message : 'error' });
    }
  }
  return { recovered };
}
