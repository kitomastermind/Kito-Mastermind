import { Panel, PanelHead } from '@/components/kito/Panel';
import { EmptyState } from '@/components/kito/EmptyState';
import { RingMotif } from '@/components/kito/RingMotif';
import { formatNairobiDate } from '@/lib/format';
import type { LessonView, TopicView } from '@/server/repositories/forum';
import { LessonFeed } from './feed';
import { Composer } from './composer';
import Link from 'next/link';

export function ForumView({
  model,
  sort,
  chapter,
  actorId,
  canModerate,
}: {
  model: {
    topic: TopicView | null;
    lessons: LessonView[];
    archive: { id: string; title: string; month: string }[];
    leaderboard: { id: string; headline: string; author: string; avg: string }[];
    lessonCount: number;
    voteCount: number;
  };
  sort: 'top' | 'recent';
  chapter: 'mine' | 'all';
  actorId: string;
  canModerate: boolean;
}) {
  const topic = model.topic;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <Panel className="relative overflow-hidden bg-primary text-cream">
          <RingMotif />
          <div className="relative p-5">
            {topic ? (
              <>
                <p className="font-mono text-[11px] tracking-[0.22em] text-chart-4 uppercase">
                  {formatNairobiDate(topic.month, 'MMMM')} Topic
                </p>
                <h2 className="mt-2 font-display text-3xl font-[450]">{topic.title}</h2>
                <p className="mt-2 text-sm text-cream">{topic.description}</p>
                <p className="mt-3 text-xs text-cream">
                  {model.lessonCount} lessons · {model.voteCount} votes · Voting closes{' '}
                  {formatNairobiDate(topic.votingClosesAt)}
                </p>
              </>
            ) : (
              <p>No topic is open this month yet.</p>
            )}
          </div>
        </Panel>
        {topic ? (
          <>
            <LessonFeed
              lessons={model.lessons}
              sort={sort}
              chapter={chapter}
              canModerate={canModerate}
            />
            <Composer topicId={topic.id} closed={topic.closed} existing={model.lessons.find((row) => row.authorId === actorId) ?? null} />
          </>
        ) : (
          <EmptyState heading="No topic is open this month yet." body="Lessons appear when your chapter lead opens the month." />
        )}
      </div>
      <aside className="space-y-6">
        <Panel>
          <PanelHead title="Top lessons this quarter" />
          <ul>
            {model.leaderboard.map((row) => (
              <li key={row.id} className="border-b border-line px-4 py-3 text-sm">
                {row.headline}
                <span className="mt-1 block text-xs text-muted">
                  {row.author} · {row.avg}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHead title="Topic archive" />
          <ul>
            {model.archive.map((row) => (
              <li key={row.id} className="border-b border-line px-4 py-3">
                <Link className="text-sm text-primary-soft" href={`/forum/${row.id}`}>
                  {row.title}
                </Link>
                <p className="text-xs text-muted">{row.month}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </aside>
    </div>
  );
}
