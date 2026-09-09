'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { canLogClosedBusiness, canVerifyClosedBusiness } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { writeAudit } from '@/server/audit';
import { deliverNotification } from '@/server/admin/notify';
import { notificationCopy } from '@/server/services/notification-copy';
import { parseBudgetInput } from '@/server/services/money';
import {
  recomputeParticipantsForDeal,
} from '@/server/admin/recalculate-points';

const ParticipantSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(['CLOSER', 'REFERRER']),
  creditShare: z.number().int().min(0).max(100),
});

export async function createDealAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      leadId: z.string().uuid().nullable(),
      saleVolume: z.string().min(1),
      closedAt: z.string().min(8),
      participants: z.array(ParticipantSchema).min(1),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the deal details and try again.' };
  const ids = parsed.data.participants.map((row) => row.profileId);
  const decision = canLogClosedBusiness(actor, ids);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const volume = parseBudgetInput(parsed.data.saleVolume);
  if (volume === null || volume <= BigInt(0)) {
    return { ok: false, error: 'Sale volume must be a positive amount.' };
  }
  const supabase = await createClient();
  const { data: deal, error } = await supabase
    .from('closed_business')
    .insert({
      lead_id: parsed.data.leadId,
      chapter_id: actor.chapterId,
      sale_volume: volume.toString() as unknown as number,
      closed_at: parsed.data.closedAt,
      created_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !deal) return { ok: false, error: error?.message ?? 'Could not log the deal.' };
  const now = new Date().toISOString();
  const { error: partError } = await supabase.from('closed_business_participants').insert(
    parsed.data.participants.map((row) => ({
      closed_business_id: deal.id,
      profile_id: row.profileId,
      participant_role: row.role,
      credit_share: row.creditShare,
      confirmed_at: row.profileId === actor.id ? now : null,
    })),
  );
  if (partError) return { ok: false, error: partError.message };
  for (const row of parsed.data.participants) {
    if (row.profileId === actor.id) continue;
    await deliverNotification({
      profileId: row.profileId,
      type: 'DEAL_CONFIRMATION_NEEDED',
      copy: notificationCopy('DEAL_CONFIRMATION_NEEDED', { otherName: actor.fullName }),
    });
  }
  revalidatePath('/dashboard');
  revalidatePath('/points');
  if (parsed.data.leadId) revalidatePath(`/leads/${parsed.data.leadId}`);
  return { ok: true, data: { id: deal.id } };
}

export async function confirmDealShareAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ dealId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Deal is required.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('closed_business_participants')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('closed_business_id', parsed.data.dealId)
    .eq('profile_id', actor.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

export async function verifyDealAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ dealId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Deal is required.' };
  const decision = canVerifyClosedBusiness(actor, actor.chapterId);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const supabase = await createClient();
  const { error } = await supabase
    .from('closed_business')
    .update({ verified_at: new Date().toISOString(), verified_by: actor.id })
    .eq('id', parsed.data.dealId);
  if (error) return { ok: false, error: error.message };
  await writeAudit({
    actorId: actor.id,
    action: 'DEAL_VERIFIED',
    subjectType: 'closed_business',
    subjectId: parsed.data.dealId,
  });
  await recomputeParticipantsForDeal(parsed.data.dealId);
  revalidatePath('/dashboard');
  revalidatePath('/points');
  return { ok: true, data: undefined };
}
