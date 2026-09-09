import { supabaseAdmin } from '@/server/admin/client';
import {
  accountReference,
  mpesaEnabled,
  shillingsFromCents,
  stkPush,
} from '@/server/services/mpesa';
import type { ActionResult } from '@/server/actions/result';

export async function startStkForContribution(input: {
  contributionId: string;
  profileId: string;
  chapterId: string;
  phone: string;
  amountCents: bigint;
  description: string;
}): Promise<ActionResult<{ checkoutRequestId: string }>> {
  if (!mpesaEnabled()) {
    return {
      ok: false,
      error: 'M-Pesa is not configured yet. Ask your treasurer to record the payment.',
    };
  }
  const { data: chapter } = await supabaseAdmin
    .from('chapters')
    .select('code')
    .eq('id', input.chapterId)
    .maybeSingle();
  const reference = accountReference(chapter?.code ?? 'NBO', input.profileId);
  const pushed = await stkPush({
    phone: input.phone,
    amountShillings: shillingsFromCents(input.amountCents),
    accountReference: reference,
    description: input.description,
  });
  const { error } = await supabaseAdmin.from('mpesa_payments').insert({
    contribution_id: input.contributionId,
    chapter_id: input.chapterId,
    profile_id: input.profileId,
    merchant_request_id: pushed.merchantRequestId,
    checkout_request_id: pushed.checkoutRequestId,
    account_reference: reference,
    phone_number: input.phone,
    amount: input.amountCents.toString() as unknown as number,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { checkoutRequestId: pushed.checkoutRequestId } };
}
