'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { canReadThread } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { deliverNotification } from '@/server/admin/notify';
import { notificationCopy } from '@/server/services/notification-copy';
import { assertRateLimit } from '@/server/admin/rate-limit';

export async function sendMatchMessageAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({ matchId: z.string().uuid(), body: z.string().min(1).max(2000) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'A message is required.' };
  const limited = await assertRateLimit(actor.id, 'MATCH_MESSAGE');
  if (!limited.ok) return limited;
  const supabase = await createClient();
  const { data: match } = await supabase
    .from('lead_matches')
    .select('id, lead_a_id, lead_b_id')
    .eq('id', parsed.data.matchId)
    .maybeSingle();
  if (!match) return { ok: false, error: 'Match not found.' };
  const { data: owners } = await supabase
    .from('lead_pool')
    .select('id, owner_id')
    .in('id', [match.lead_a_id, match.lead_b_id]);
  const leadA = owners?.find((row) => row.id === match.lead_a_id);
  const leadB = owners?.find((row) => row.id === match.lead_b_id);
  if (!leadA?.owner_id || !leadB?.owner_id) return { ok: false, error: 'Match not found.' };
  const decision = canReadThread(actor, { ownerId: leadA.owner_id }, { ownerId: leadB.owner_id });
  if (!decision.allow) return { ok: false, error: decision.reason };
  let { data: thread } = await supabase
    .from('match_threads')
    .select('id')
    .eq('match_id', match.id)
    .maybeSingle();
  if (!thread) {
    const inserted = await supabase.from('match_threads').insert({ match_id: match.id }).select('id').single();
    if (inserted.error || !inserted.data) return { ok: false, error: inserted.error?.message ?? 'Could not open the thread.' };
    thread = inserted.data;
  }
  const { error } = await supabase.from('match_messages').insert({
    thread_id: thread.id,
    author_id: actor.id,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: error.message };
  const otherId = actor.id === leadA.owner_id ? leadB.owner_id : leadA.owner_id;
  await deliverNotification({
    profileId: otherId,
    type: 'MATCH_MESSAGE',
    copy: notificationCopy('MATCH_MESSAGE', { otherName: actor.fullName, matchId: match.id }),
  });
  revalidatePath(`/matches/${match.id}`);
  return { ok: true, data: undefined };
}
