'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { canAssignPairings } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';

export async function assignPairingsAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      cycleId: z.string().uuid(),
      pairs: z.array(z.tuple([z.string().uuid(), z.string().uuid()])),
      triples: z.array(z.tuple([z.string().uuid(), z.string().uuid(), z.string().uuid()])),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pairings are required.' };
  const decision = canAssignPairings(actor, actor.chapterId);
  if (!decision.allow) return { ok: false, error: decision.reason };

  const supabase = await createClient();
  const { error: endError } = await supabase
    .from('pairings')
    .update({ ended_at: new Date().toISOString() })
    .eq('chapter_id', actor.chapterId)
    .eq('cycle_id', parsed.data.cycleId)
    .is('ended_at', null);
  if (endError) return { ok: false, error: endError.message };

  const rows: { chapter_id: string; cycle_id: string; profile_a: string; profile_b: string }[] = [];
  for (const [left, right] of parsed.data.pairs) {
    const [a, b] = left < right ? [left, right] : [right, left];
    rows.push({ chapter_id: actor.chapterId, cycle_id: parsed.data.cycleId, profile_a: a, profile_b: b });
  }
  for (const triple of parsed.data.triples) {
    const [x, y, z] = [...triple].sort();
    if (!x || !y || !z) continue;
    rows.push({ chapter_id: actor.chapterId, cycle_id: parsed.data.cycleId, profile_a: x, profile_b: y });
    rows.push({ chapter_id: actor.chapterId, cycle_id: parsed.data.cycleId, profile_a: x, profile_b: z });
    rows.push({ chapter_id: actor.chapterId, cycle_id: parsed.data.cycleId, profile_a: y, profile_b: z });
  }
  if (rows.length > 0) {
    const { error } = await supabase.from('pairings').insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath('/admin/pairings');
  revalidatePath('/accountability');
  return { ok: true, data: undefined };
}
