'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { canRecordContribution } from '@/server/policy';
import { requireActor } from '@/server/supabase/server';
import { createClient } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { writeAudit } from '@/server/audit';
import { recomputeCurrentCycleForProfile } from '@/server/admin/recalculate-points';

export async function allocatePaymentAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({ paymentId: z.string().uuid(), contributionId: z.string().uuid() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Payment and contribution are required.' };
  const decision = canRecordContribution(actor, actor.chapterId);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const supabase = await createClient();
  const { error } = await supabase.rpc('allocate_mpesa_payment', {
    p_payment_id: parsed.data.paymentId,
    p_contribution_id: parsed.data.contributionId,
    p_actor: actor.id,
  });
  if (error) return { ok: false, error: error.message };
  const { data: contribution } = await supabase
    .from('contributions')
    .select('profile_id')
    .eq('id', parsed.data.contributionId)
    .maybeSingle();
  if (contribution?.profile_id) {
    await recomputeCurrentCycleForProfile(contribution.profile_id);
  }
  await writeAudit({
    actorId: actor.id,
    action: 'PAYMENT_ALLOCATED',
    subjectType: 'mpesa_payment',
    subjectId: parsed.data.paymentId,
    metadata: { contributionId: parsed.data.contributionId },
  });
  revalidatePath('/admin/payments');
  revalidatePath('/reports');
  return { ok: true, data: undefined };
}
