import { formatNairobiDate } from '@/lib/format';
import type { Actor } from '@/server/policy';
import { pipelineFromStatuses } from '@/server/services/dashboard-stats';
import { createClient } from '@/server/supabase/server';
import type { DashboardMatch, DashboardModel } from '@/server/dto/dashboard';

export async function loadActions(actor: Actor): Promise<DashboardModel['actions']> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accountability_actions')
    .select('description, due_date, status, session_id, mastermind_sessions(held_at)')
    .eq('owner_id', actor.id)
    .in('status', ['NOT_STARTED', 'IN_PROGRESS', 'OVERDUE', 'COMPLETED'])
    .order('due_date', { ascending: true })
    .limit(3);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const held =
      row.mastermind_sessions &&
      typeof row.mastermind_sessions === 'object' &&
      'held_at' in row.mastermind_sessions
        ? String(row.mastermind_sessions.held_at)
        : null;
    return {
      title: row.description,
      meta: held ? `From ${formatNairobiDate(held)} session` : `Due ${formatNairobiDate(row.due_date)}`,
      status: row.status,
    };
  });
}

export async function loadPipeline(actor: Actor): Promise<DashboardModel['pipeline']> {
  const supabase = await createClient();
  const { data: members, error: memberError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('chapter_id', actor.chapterId)
    .eq('active', true);
  if (memberError) throw memberError;
  if ((members ?? []).length < 3) return null;
  const { data: pool, error: poolError } = await supabase
    .from('lead_pool')
    .select('owner_id, status');
  if (poolError) throw poolError;
  return (members ?? []).map((member) => {
    const statuses = (pool ?? [])
      .filter((row) => row.owner_id === member.id && row.status)
      .map((row) => row.status as string);
    return { memberName: member.full_name, ...pipelineFromStatuses(statuses) };
  });
}

export async function loadMatch(
  actor: Actor,
  chapterName: string,
): Promise<DashboardMatch | null> {
  const supabase = await createClient();
  const { data: matches, error } = await supabase
    .from('lead_matches')
    .select('id, lead_a_id, lead_b_id, score, matched_facets, created_at')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  const { data: pool } = await supabase
    .from('lead_pool')
    .select('id, owner_id, owner_name, created_at');
  for (const match of matches ?? []) {
    const a = pool?.find((row) => row.id === match.lead_a_id);
    const b = pool?.find((row) => row.id === match.lead_b_id);
    if (!a || !b) continue;
    const mine = a.owner_id === actor.id ? a : b.owner_id === actor.id ? b : null;
    const other = mine === a ? b : a;
    if (!mine || other.owner_id === actor.id) continue;
    if (!other.owner_name || !other.created_at || !other.id) continue;
    const facetsRaw = match.matched_facets;
    const facets: { label: string; kind: 'exact' | 'partial' }[] = Array.isArray(facetsRaw)
      ? facetsRaw.flatMap((item) => {
          if (!item || typeof item !== 'object' || !('label' in item) || !('kind' in item)) {
            return [];
          }
          const kind = item.kind === 'exact' || item.kind === 'partial' ? item.kind : null;
          if (!kind) return [];
          return [{ label: String(item.label), kind }];
        })
      : [];
    return {
      ownerName: other.owner_name,
      loggedAt: formatNairobiDate(other.created_at),
      chapterName,
      score: match.score,
      facets,
      otherLeadId: other.id,
      matchId: match.id,
    };
  }
  return null;
}

export async function loadTopic(monthStart: string): Promise<DashboardModel['topic']> {
  const supabase = await createClient();
  const { data: topic, error } = await supabase
    .from('forum_topics')
    .select('id, title, description')
    .eq('month', monthStart)
    .order('opens_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!topic) return null;
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, headline, author_id')
    .eq('topic_id', topic.id)
    .is('hidden_at', null);
  const authorIds = [...new Set((posts ?? []).map((post) => post.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const { data: stats } = await supabase.from('forum_post_stats').select('post_id, average_rating');
  let top: { headline: string; author: string } | null = null;
  let best = -1;
  for (const post of posts ?? []) {
    const rating = Number(stats?.find((row) => row.post_id === post.id)?.average_rating ?? 0);
    if (rating >= best) {
      best = rating;
      const author = authors?.find((row) => row.id === post.author_id)?.full_name ?? 'Member';
      top = { headline: post.headline, author };
    }
  }
  return {
    title: topic.title,
    prompt: topic.description,
    topHeadline: top?.headline ?? null,
    topAuthor: top?.author ?? null,
  };
}
