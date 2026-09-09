import { formatNairobiDate, NAIROBI_TZ } from '@/lib/format';
import type { Actor } from '@/server/policy';
import { createClient } from '@/server/supabase/server';
import { formatInTimeZone } from 'date-fns-tz';

export type LessonView = {
  id: string;
  topicId: string;
  authorId: string;
  author: string;
  chapterName: string;
  postedAt: string;
  headline: string;
  body: string;
  avgRating: string;
  ratingCount: number;
  replyCount: number;
  myRating: number | null;
  isTop: boolean;
  canRate: boolean;
  hidden: boolean;
};

export type TopicView = {
  id: string;
  title: string;
  description: string;
  month: string;
  opensAt: string;
  votingClosesAt: string;
  closed: boolean;
};

export async function loadForumHome(actor: Actor, sort: 'top' | 'recent', chapter: 'mine' | 'all') {
  const supabase = await createClient();
  const monthStart = formatInTimeZone(new Date(), NAIROBI_TZ, 'yyyy-MM-01');
  const quarterStart = formatInTimeZone(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), NAIROBI_TZ, 'yyyy-MM-01');
  const { data: current } = await supabase
    .from('forum_topics')
    .select('id, title, description, month, opens_at, voting_closes_at')
    .eq('month', monthStart)
    .maybeSingle();
  const { data: archive } = await supabase
    .from('forum_topics')
    .select('id, title, month')
    .order('month', { ascending: false })
    .limit(12);
  const topic = current
    ? {
        id: current.id,
        title: current.title,
        description: current.description,
        month: current.month,
        opensAt: current.opens_at,
        votingClosesAt: current.voting_closes_at,
        closed: new Date(current.voting_closes_at) < new Date(),
      }
    : null;
  const lessons = topic ? await loadLessons(actor, topic.id, sort, chapter) : [];
  const { data: quarterTopics } = await supabase
    .from('forum_topics')
    .select('id')
    .gte('month', quarterStart);
  const quarterIds = new Set((quarterTopics ?? []).map((row) => row.id));
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, headline, author_id, topic_id')
    .is('hidden_at', null);
  const { data: stats } = await supabase.from('forum_post_stats').select('post_id, average_rating, rating_count');
  const ranked = (posts ?? [])
    .filter((post) => quarterIds.has(post.topic_id))
    .map((post) => ({
      ...post,
      avg: Number(stats?.find((row) => row.post_id === post.id)?.average_rating ?? 0),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);
  const authorIds = ranked.map((row) => row.author_id);
  const { data: authors } = authorIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
    : { data: [] as { id: string; full_name: string }[] };
  return {
    topic,
    lessons,
    archive: (archive ?? []).map((row) => ({ id: row.id, title: row.title, month: row.month })),
    leaderboard: ranked.map((row) => ({
      id: row.id,
      headline: row.headline,
      author: authors?.find((item) => item.id === row.author_id)?.full_name ?? 'Member',
      avg: row.avg.toFixed(1),
    })),
    lessonCount: lessons.length,
    voteCount: lessons.reduce((sum, row) => sum + row.ratingCount, 0),
  };
}

export async function loadLessons(
  actor: Actor,
  topicId: string,
  sort: 'top' | 'recent',
  chapter: 'mine' | 'all',
): Promise<LessonView[]> {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from('forum_posts')
    .select('id, topic_id, author_id, headline, body, created_at, hidden_at')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const { data: stats } = await supabase.from('forum_post_stats').select('post_id, average_rating, rating_count, reply_count');
  const { data: mine } = await supabase.from('forum_ratings').select('post_id, stars').eq('profile_id', actor.id);
  const authorIds = [...new Set((posts ?? []).map((row) => row.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from('profiles').select('id, full_name, chapter_id, chapters(name)').in('id', authorIds)
    : { data: [] as { id: string; full_name: string; chapter_id: string; chapters: { name: string } | { name: string }[] | null }[] };
  const mapped = (posts ?? [])
    .filter((post) => !post.hidden_at || post.author_id === actor.id || actor.role === 'CHAPTER_LEAD' || actor.role === 'ADMIN')
    .map((post) => {
      const author = authors?.find((row) => row.id === post.author_id);
      const chapterRel = author?.chapters;
      const chapterName =
        chapterRel && typeof chapterRel === 'object' && 'name' in chapterRel
          ? String(chapterRel.name)
          : Array.isArray(chapterRel) && chapterRel[0]
            ? chapterRel[0].name
            : 'Chapter';
      if (chapter === 'mine' && author?.chapter_id !== actor.chapterId) return null;
      const stat = stats?.find((row) => row.post_id === post.id);
      const myRating = mine?.find((row) => row.post_id === post.id)?.stars ?? null;
      return {
        id: post.id,
        topicId: post.topic_id,
        authorId: post.author_id,
        author: author?.full_name ?? 'Member',
        chapterName,
        postedAt: formatNairobiDate(post.created_at),
        headline: post.headline,
        body: post.body,
        avgRating: Number(stat?.average_rating ?? 0).toFixed(1),
        ratingCount: stat?.rating_count ?? 0,
        replyCount: stat?.reply_count ?? 0,
        myRating,
        isTop: false,
        canRate: post.author_id !== actor.id && !post.hidden_at,
        hidden: Boolean(post.hidden_at),
      };
    })
    .filter((row): row is LessonView => row !== null);
  const top = [...mapped].sort(
    (a, b) => Number(b.avgRating) - Number(a.avgRating) || b.ratingCount - a.ratingCount,
  )[0];
  if (top && Number(top.avgRating) > 0) {
    for (const row of mapped) {
      row.isTop = row.id === top.id;
    }
  }
  return [...mapped].sort((a, b) =>
    sort === 'recent' ? 0 : Number(b.avgRating) - Number(a.avgRating) || b.ratingCount - a.ratingCount,
  );
}

export async function loadTopicById(actor: Actor, topicId: string) {
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from('forum_topics')
    .select('id, title, description, month, opens_at, voting_closes_at')
    .eq('id', topicId)
    .maybeSingle();
  if (!topic) return null;
  const closed = new Date(topic.voting_closes_at) < new Date();
  const lessons = await loadLessons(actor, topic.id, 'top', 'all');
  return {
    topic: {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      month: topic.month,
      opensAt: topic.opens_at,
      votingClosesAt: topic.voting_closes_at,
      closed,
    },
    lessons,
  };
}
