import { supabaseAdmin } from '@/server/admin/client';
import { accountReference } from '@/server/services/mpesa';
import type { Json } from '@/lib/types/database';

export async function applyC2bConfirmation(raw: Record<string, unknown>): Promise<{ allocated: boolean }> {
  const receipt = String(raw.TransID ?? raw.transactionId ?? '');
  const phone = String(raw.MSISDN ?? raw.phone ?? '');
  const billRef = String(raw.BillRefNumber ?? raw.accountReference ?? '');
  const amountShillings = BigInt(String(raw.TransAmount ?? raw.amount ?? '0'));
  const amountCents = amountShillings * BigInt(100);

  if (receipt) {
    const { data: existing } = await supabaseAdmin
      .from('mpesa_payments')
      .select('id, contribution_id')
      .eq('mpesa_receipt_number', receipt)
      .maybeSingle();
    if (existing?.contribution_id) return { allocated: true };
    if (existing) return { allocated: false };
  }

  const { data: chapters } = await supabaseAdmin.from('chapters').select('id, code');
  let profileId: string | null = null;
  let chapterId: string | null = null;
  for (const chapter of chapters ?? []) {
    const { data: members } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('chapter_id', chapter.id)
      .eq('active', true);
    const match = (members ?? []).find(
      (row) => accountReference(chapter.code, row.id) === billRef,
    );
    if (match) {
      profileId = match.id;
      chapterId = chapter.id;
      break;
    }
  }

  let contributionId: string | null = null;
  if (profileId) {
    const { data: dues } = await supabaseAdmin
      .from('contributions')
      .select('id')
      .eq('profile_id', profileId)
      .eq('status', 'PENDING')
      .is('voided_at', null)
      .eq('amount', amountCents.toString() as unknown as number);
    if ((dues ?? []).length === 1) contributionId = dues?.[0]?.id ?? null;
  } else if (phone) {
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, chapter_id, phone').eq('phone', phone.startsWith('+') ? phone : `+${phone}`);
    if ((profiles ?? []).length === 1 && profiles?.[0]) {
      profileId = profiles[0].id;
      chapterId = profiles[0].chapter_id;
      const { data: dues } = await supabaseAdmin
        .from('contributions')
        .select('id')
        .eq('profile_id', profileId)
        .eq('status', 'PENDING')
        .is('voided_at', null)
        .eq('amount', amountCents.toString() as unknown as number);
      if ((dues ?? []).length === 1) contributionId = dues?.[0]?.id ?? null;
      if ((dues ?? []).length !== 1) contributionId = null;
    }
  }

  const { error } = await supabaseAdmin.from('mpesa_payments').insert({
    contribution_id: contributionId,
    chapter_id: chapterId,
    profile_id: profileId,
    mpesa_receipt_number: receipt || null,
    account_reference: billRef || null,
    phone_number: phone || 'unknown',
    amount: amountCents.toString() as unknown as number,
    result_code: 0,
    result_desc: 'C2B confirmation',
    raw_callback: raw as Json,
    completed_at: new Date().toISOString(),
    allocated_at: contributionId ? new Date().toISOString() : null,
  });
  if (error) throw error;
  if (contributionId) {
    await supabaseAdmin
      .from('contributions')
      .update({ status: 'PAID', method: 'MPESA', paid_at: new Date().toISOString() })
      .eq('id', contributionId)
      .is('voided_at', null);
    return { allocated: true };
  }
  return { allocated: false };
}
