'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  canGenerateStatement,
  canRecordContribution,
  canVoidContribution,
} from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { startStkForContribution } from '@/server/admin/stk';
import { generateAndStoreStatement } from '@/server/admin/statements';
import { mpesaEnabled } from '@/server/services/mpesa';
import { getContribution } from '@/server/repositories/contributions';
import { fromShillings } from '@/server/services/money';

export async function recordContributionAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      profileId: z.string().uuid(),
      type: z.enum(['DUES', 'FINE', 'EVENT_FEE', 'DONATION']),
      amountShillings: z.string().min(1),
      method: z.enum(['MPESA', 'CASH', 'BANK_TRANSFER']),
      date: z.string().min(8),
      description: z.string().min(3).max(200),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the contribution and try again.' };
  const decision = canRecordContribution(actor, actor.chapterId);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const amount = fromShillings(parsed.data.amountShillings);
  if (amount <= BigInt(0)) return { ok: false, error: 'Amount must be greater than zero.' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contributions')
    .insert({
      profile_id: parsed.data.profileId,
      chapter_id: actor.chapterId,
      type: parsed.data.type,
      description: parsed.data.description,
      amount: amount.toString() as unknown as number,
      method: parsed.data.method,
      status: 'PAID',
      paid_at: `${parsed.data.date}T12:00:00+03:00`,
      recorded_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not record the contribution.' };
  revalidatePath('/reports');
  return { ok: true, data: { id: data.id } };
}

export async function voidContributionAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({ id: z.string().uuid(), reason: z.string().min(3).max(300) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'A void reason is required.' };
  const row = await getContribution(actor, parsed.data.id);
  if (!row) return { ok: false, error: 'Contribution not found.' };
  const decision = canVoidContribution(
    actor,
    { profileId: row.profileId, chapterId: row.chapterId, createdAt: row.createdAt, voidedAt: row.voidedAt },
    new Date(),
  );
  if (!decision.allow) return { ok: false, error: decision.reason };
  const supabase = await createClient();
  const { error } = await supabase
    .from('contributions')
    .update({ voided_at: new Date().toISOString(), void_reason: parsed.data.reason, status: 'REVERSED' })
    .eq('id', row.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/reports');
  return { ok: true, data: undefined };
}

export async function payWithMpesaAction(
  input: unknown,
): Promise<ActionResult<{ checkoutRequestId: string }>> {
  const actor = await requireActor();
  const parsed = z.object({ contributionId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Contribution is required.' };
  if (!mpesaEnabled()) {
    return {
      ok: false,
      error: 'M-Pesa is not configured yet. Ask your treasurer to record the payment.',
    };
  }
  const row = await getContribution(actor, parsed.data.contributionId);
  if (!row || row.profileId !== actor.id) return { ok: false, error: 'Contribution not found.' };
  if (row.status !== 'PENDING' || row.voidedAt) {
    return { ok: false, error: 'This contribution cannot be paid.' };
  }
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', actor.id)
    .maybeSingle();
  if (!profile?.phone) return { ok: false, error: 'Add a phone number in Settings before paying with M-Pesa.' };
  return startStkForContribution({
    contributionId: row.id,
    profileId: actor.id,
    chapterId: actor.chapterId,
    phone: profile.phone,
    amountCents: BigInt(row.amountCents),
    description: row.description,
  });
}

export async function generateStatementAction(
  input: unknown,
): Promise<ActionResult<{ reference: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      period: z.enum(['cycle', 'year', 'all', 'custom']),
      format: z.enum(['PDF', 'CSV']),
      start: z.string().optional(),
      end: z.string().optional(),
      chapterReport: z.boolean().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Choose a period and format.' };
  const decision = canGenerateStatement(actor, actor.id);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const result = await generateAndStoreStatement({
    actor,
    period: parsed.data.period,
    format: parsed.data.format,
    start: parsed.data.start,
    end: parsed.data.end,
    chapterReport: parsed.data.chapterReport === true,
  });
  revalidatePath('/reports');
  return result;
}
