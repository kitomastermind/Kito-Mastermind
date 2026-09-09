'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import {
  applyVerifyAction,
  refuseCompleteAction,
  refuseCreateAction,
  refuseNudge,
} from '@/server/services/accountability-transitions';
import { deliverNotification } from '@/server/admin/notify';
import { notificationCopy } from '@/server/services/notification-copy';
import { firstName } from '@/lib/format';
import { assertRateLimit } from '@/server/admin/rate-limit';

function revalidateAccountability(): void {
  revalidatePath('/accountability');
  revalidatePath('/dashboard');
}

async function loadPairing(actorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pairings')
    .select('profile_a, profile_b, ended_at')
    .is('ended_at', null);
  if (error) throw error;
  const mine = (data ?? []).find(
    (row) => row.profile_a === actorId || row.profile_b === actorId,
  );
  return mine
    ? { profileA: mine.profile_a, profileB: mine.profile_b, endedAt: mine.ended_at }
    : null;
}

async function loadAction(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accountability_actions')
    .select('id, owner_id, partner_id, chapter_id, status, nudged_at, description')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createActionAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      ownerId: z.string().uuid(),
      description: z.string().min(3).max(300),
      dueDate: z.string().min(8),
      sessionId: z.string().uuid().nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the action and try again.' };
  const pairing = await loadPairing(actor.id);
  const refused = refuseCreateAction(actor, parsed.data.ownerId, pairing);
  if (refused) return { ok: false, error: refused };
  const partnerId =
    pairing && parsed.data.ownerId === pairing.profileA
      ? pairing.profileB
      : pairing && parsed.data.ownerId === pairing.profileB
        ? pairing.profileA
        : null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accountability_actions')
    .insert({
      owner_id: parsed.data.ownerId,
      partner_id: partnerId,
      chapter_id: actor.chapterId,
      description: parsed.data.description,
      due_date: parsed.data.dueDate,
      session_id: parsed.data.sessionId,
      status: 'NOT_STARTED',
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not create the action.' };
  revalidateAccountability();
  return { ok: true, data: { id: data.id } };
}

export async function completeActionAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Action is required.' };
  const row = await loadAction(parsed.data.id);
  if (!row) return { ok: false, error: 'Action not found.' };
  const refused = refuseCompleteAction(actor, {
    ownerId: row.owner_id,
    partnerId: row.partner_id,
    chapterId: row.chapter_id,
    status: row.status,
    nudgedAt: row.nudged_at,
  });
  if (refused) return { ok: false, error: refused };
  const supabase = await createClient();
  const { error } = await supabase
    .from('accountability_actions')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', row.id);
  if (error) return { ok: false, error: error.message };
  if (row.partner_id) {
    await deliverNotification({
      profileId: row.partner_id,
      type: 'VERIFICATION_NEEDED',
      copy: notificationCopy('VERIFICATION_NEEDED', { otherName: firstName(actor.fullName) }),
    });
  }
  revalidateAccountability();
  return { ok: true, data: undefined };
}

export async function verifyActionAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Action is required.' };
  const row = await loadAction(parsed.data.id);
  if (!row) return { ok: false, error: 'Action not found.' };
  const supabase = await createClient();
  const result = await applyVerifyAction(
    actor,
    {
      ownerId: row.owner_id,
      partnerId: row.partner_id,
      chapterId: row.chapter_id,
      status: row.status,
      nudgedAt: row.nudged_at,
    },
    async () =>
      supabase
        .from('accountability_actions')
        .update({ status: 'VERIFIED', verified_by: actor.id })
        .eq('id', row.id),
  );
  if (!result.ok) return result;
  await deliverNotification({
    profileId: row.owner_id,
    type: 'ACTION_VERIFIED',
    copy: notificationCopy('ACTION_VERIFIED', { otherName: firstName(actor.fullName) }),
  });
  revalidateAccountability();
  return result;
}

export async function nudgeActionAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Action is required.' };
  const row = await loadAction(parsed.data.id);
  if (!row) return { ok: false, error: 'Action not found.' };
  const refused = refuseNudge(
    actor,
    {
      ownerId: row.owner_id,
      partnerId: row.partner_id,
      chapterId: row.chapter_id,
      status: row.status,
      nudgedAt: row.nudged_at,
    },
    new Date(),
  );
  if (refused) return { ok: false, error: refused };
  const limited = await assertRateLimit(actor.id, 'NUDGE');
  if (!limited.ok) return limited;
  const supabase = await createClient();
  const { error } = await supabase
    .from('accountability_actions')
    .update({ nudged_at: new Date().toISOString() })
    .eq('id', row.id);
  if (error) return { ok: false, error: error.message };
  await deliverNotification({
    profileId: row.owner_id,
    type: 'NUDGE',
    copy: notificationCopy('NUDGE', { otherName: firstName(actor.fullName) }),
  });
  revalidateAccountability();
  return { ok: true, data: undefined };
}

export async function requestPairingAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z.object({ reason: z.string().max(300).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Could not send the request.' };
  const supabase = await createClient();
  const { data: before } = await supabase
    .from('pairings')
    .select('id')
    .is('ended_at', null);
  const { data, error } = await supabase
    .from('pairing_requests')
    .insert({
      profile_id: actor.id,
      chapter_id: actor.chapterId,
      reason: parsed.data.reason ?? null,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not send the request.' };
  const { data: after } = await supabase.from('pairings').select('id').is('ended_at', null);
  if ((before ?? []).length !== (after ?? []).length) {
    return { ok: false, error: 'Pairing request must not unpair anyone.' };
  }
  revalidateAccountability();
  return { ok: true, data: { id: data.id } };
}
