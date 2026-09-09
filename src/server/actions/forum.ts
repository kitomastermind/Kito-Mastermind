'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { canHidePost, canRatePost } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { writeAudit } from '@/server/audit';
import { deliverNotification } from '@/server/admin/notify';
import { notificationCopy } from '@/server/services/notification-copy';

export async function upsertLessonAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      topicId: z.string().uuid(),
      headline: z.string().min(5).max(120),
      body: z.string().min(20).max(4000),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Headline and body are required.' };
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from('forum_topics')
    .select('voting_closes_at')
    .eq('id', parsed.data.topicId)
    .maybeSingle();
  if (!topic) return { ok: false, error: 'Topic not found.' };
  if (new Date(topic.voting_closes_at) < new Date()) {
    return { ok: false, error: 'Voting has closed for this topic.' };
  }
  const { data: existing } = await supabase
    .from('forum_posts')
    .select('id')
    .eq('topic_id', parsed.data.topicId)
    .eq('author_id', actor.id)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from('forum_posts')
      .update({
        headline: parsed.data.headline,
        body: parsed.data.body,
        edited_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/forum');
    return { ok: true, data: { id: existing.id } };
  }
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      topic_id: parsed.data.topicId,
      author_id: actor.id,
      headline: parsed.data.headline,
      body: parsed.data.body,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not post.' };
  revalidatePath('/forum');
  return { ok: true, data: { id: data.id } };
}

export async function rateLessonAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ postId: z.string().uuid(), stars: z.number().int().min(1).max(5) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Choose a rating.' };
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('forum_posts')
    .select('id, author_id')
    .eq('id', parsed.data.postId)
    .maybeSingle();
  if (!post) return { ok: false, error: 'Lesson not found.' };
  const { data: existing } = await supabase
    .from('forum_ratings')
    .select('stars')
    .eq('post_id', post.id)
    .eq('profile_id', actor.id)
    .maybeSingle();
  const decision = canRatePost(actor, { id: post.id, authorId: post.author_id, chapterId: actor.chapterId }, existing);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const { error } = await supabase.from('forum_ratings').upsert({
    post_id: post.id,
    profile_id: actor.id,
    stars: parsed.data.stars,
  }, { onConflict: 'post_id,profile_id' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/forum');
  return { ok: true, data: undefined };
}

export async function replyToLessonAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ postId: z.string().uuid(), body: z.string().min(1).max(2000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Reply is required.' };
  const supabase = await createClient();
  const { data: post } = await supabase.from('forum_posts').select('id, author_id, topic_id').eq('id', parsed.data.postId).maybeSingle();
  if (!post) return { ok: false, error: 'Lesson not found.' };
  const { error } = await supabase.from('forum_replies').insert({
    post_id: post.id,
    author_id: actor.id,
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: error.message };
  if (post.author_id !== actor.id) {
    await deliverNotification({
      profileId: post.author_id,
      type: 'FORUM_REPLY',
      copy: notificationCopy('FORUM_REPLY', { otherName: actor.fullName, topicId: post.topic_id }),
    });
  }
  revalidatePath('/forum');
  return { ok: true, data: undefined };
}

export async function hideLessonAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ postId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Lesson is required.' };
  const supabase = await createClient();
  const { data: post } = await supabase.from('forum_posts').select('id, author_id').eq('id', parsed.data.postId).maybeSingle();
  if (!post) return { ok: false, error: 'Lesson not found.' };
  const decision = canHidePost(actor, { id: post.id, authorId: post.author_id, chapterId: actor.chapterId });
  if (!decision.allow) return { ok: false, error: decision.reason };
  const { error } = await supabase
    .from('forum_posts')
    .update({ hidden_at: new Date().toISOString(), hidden_by: actor.id })
    .eq('id', post.id);
  if (error) return { ok: false, error: error.message };
  await writeAudit({
    actorId: actor.id,
    action: 'FORUM_POST_HIDDEN',
    subjectType: 'forum_post',
    subjectId: post.id,
  });
  revalidatePath('/forum');
  return { ok: true, data: undefined };
}
