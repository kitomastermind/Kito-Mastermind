'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { canCreateSession, canCreateTopic, canManageChapters } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { fromShillings } from '@/server/services/money';
import { recomputeAfterAttendance } from '@/server/admin/recalculate-points';

export async function upsertChapterAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const decision = canManageChapters(actor);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const parsed = z
    .object({
      id: z.string().uuid().optional(),
      name: z.string().min(2).max(80),
      code: z.string().min(2).max(8),
      region: z.string().max(80).optional(),
      active: z.boolean().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the chapter fields.' };
  const supabase = await createClient();
  if (parsed.data.id) {
    const { error } = await supabase
      .from('chapters')
      .update({
        name: parsed.data.name,
        code: parsed.data.code,
        region: parsed.data.region ?? null,
        active: parsed.data.active ?? true,
      })
      .eq('id', parsed.data.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin/chapters');
    return { ok: true, data: { id: parsed.data.id } };
  }
  const { data, error } = await supabase
    .from('chapters')
    .insert({
      name: parsed.data.name,
      code: parsed.data.code,
      region: parsed.data.region ?? null,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not create the chapter.' };
  revalidatePath('/admin/chapters');
  return { ok: true, data: { id: data.id } };
}

export async function createCycleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      chapterId: z.string().uuid(),
      name: z.string().min(2).max(80),
      start: z.string().min(8),
      end: z.string().min(8),
      pointsCap: z.number().int().min(1).max(2000),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the cycle fields.' };
  if (!canManageChapters(actor).allow) {
    return { ok: false, error: 'Only an admin can create a cycle.' };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cycles')
    .insert({
      chapter_id: parsed.data.chapterId,
      name: parsed.data.name,
      start_date: parsed.data.start,
      end_date: parsed.data.end,
      points_cap: parsed.data.pointsCap,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not create the cycle.' };
  revalidatePath('/admin/cycles');
  return { ok: true, data: { id: data.id } };
}

export async function createDuesScheduleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      chapterId: z.string().uuid(),
      amountShillings: z.string().min(1),
      dayOfMonth: z.number().int().min(1).max(28),
      effectiveFrom: z.string().min(8),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the dues schedule.' };
  if (actor.role !== 'ADMIN') return { ok: false, error: 'Only an admin can set dues schedules.' };
  const amount = fromShillings(parsed.data.amountShillings);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('dues_schedules')
    .insert({
      chapter_id: parsed.data.chapterId,
      amount: amount.toString() as unknown as number,
      day_of_month: parsed.data.dayOfMonth,
      effective_from: parsed.data.effectiveFrom,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not save the schedule.' };
  revalidatePath('/admin/chapters');
  return { ok: true, data: { id: data.id } };
}

export async function createSessionAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      heldAt: z.string().min(8),
      topicId: z.string().uuid().nullable(),
      notes: z.string().max(400).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Session date is required.' };
  const decision = canCreateSession(actor, actor.chapterId);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('mastermind_sessions')
    .insert({
      chapter_id: actor.chapterId,
      held_at: parsed.data.heldAt,
      topic_id: parsed.data.topicId,
      notes: parsed.data.notes ?? null,
      created_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not create the session.' };
  revalidatePath('/admin/sessions');
  return { ok: true, data: { id: data.id } };
}

export async function markAttendanceAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      sessionId: z.string().uuid(),
      profileId: z.string().uuid(),
      present: z.boolean(),
      late: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Attendance row is required.' };
  const decision = canCreateSession(actor, actor.chapterId);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const supabase = await createClient();
  const { error } = await supabase.from('session_attendance').upsert(
    {
      session_id: parsed.data.sessionId,
      profile_id: parsed.data.profileId,
      present: parsed.data.present,
      late: parsed.data.late,
      marked_by: actor.id,
      marked_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,profile_id' },
  );
  if (error) return { ok: false, error: error.message };
  await recomputeAfterAttendance(parsed.data.profileId);
  revalidatePath('/admin/sessions');
  return { ok: true, data: undefined };
}

export async function createTopicAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      title: z.string().min(5).max(160),
      description: z.string().min(10).max(2000),
      month: z.string().min(8),
      opensAt: z.string().min(8),
      votingClosesAt: z.string().min(8),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check the topic fields.' };
  const decision = canCreateTopic(actor, null);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('forum_topics')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      month: parsed.data.month.slice(0, 8) + '01',
      opens_at: parsed.data.opensAt,
      voting_closes_at: parsed.data.votingClosesAt,
      created_by: actor.id,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not create the topic.' };
  revalidatePath('/admin/topics');
  revalidatePath('/forum');
  return { ok: true, data: { id: data.id } };
}
