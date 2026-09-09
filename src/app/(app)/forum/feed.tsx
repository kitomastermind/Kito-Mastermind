'use client';

import { LessonCard } from '@/components/kito/LessonCard';
import { hideLessonAction, rateLessonAction, replyToLessonAction } from '@/server/actions/forum';
import type { LessonView } from '@/server/repositories/forum';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LessonFeed({
  lessons,
  sort,
  chapter,
  canModerate,
  readOnly,
}: {
  lessons: LessonView[];
  sort: 'top' | 'recent';
  chapter: 'mine' | 'all';
  canModerate: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  return (
    <div className="space-y-3">
      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          <Link className={`h-11 rounded-full border px-3 text-sm leading-[44px] ${sort === 'top' ? 'border-secondary bg-secondary-pale' : 'border-line'}`} href="/forum?sort=top">
            Top rated
          </Link>
          <Link className={`h-11 rounded-full border px-3 text-sm leading-[44px] ${sort === 'recent' ? 'border-secondary bg-secondary-pale' : 'border-line'}`} href="/forum?sort=recent">
            Most recent
          </Link>
          <Link className={`h-11 rounded-full border px-3 text-sm leading-[44px] ${chapter === 'mine' ? 'border-secondary bg-secondary-pale' : 'border-line'}`} href={`/forum?sort=${sort}&chapter=mine`}>
            My chapter
          </Link>
          <Link className={`h-11 rounded-full border px-3 text-sm leading-[44px] ${chapter === 'all' ? 'border-secondary bg-secondary-pale' : 'border-line'}`} href={`/forum?sort=${sort}&chapter=all`}>
            All chapters
          </Link>
        </div>
      )}
      {lessons.map((lesson) => (
        <div key={lesson.id}>
          <LessonCard
            author={lesson.author}
            chapterName={lesson.chapterName}
            postedAt={lesson.postedAt}
            headline={lesson.headline}
            body={lesson.body}
            avgRating={lesson.avgRating}
            ratingCount={lesson.ratingCount}
            replyCount={lesson.replyCount}
            myRating={lesson.myRating}
            isTop={lesson.isTop}
            canRate={readOnly ? false : lesson.canRate}
            onRate={
              !readOnly && lesson.canRate
                ? async (stars) => {
                    await rateLessonAction({ postId: lesson.id, stars });
                    router.refresh();
                  }
                : undefined
            }
          />
          <div className="mt-2 flex gap-2">
            {readOnly ? null : (
              <button type="button" className="h-11 px-3 text-sm" onClick={() => setReplyFor(lesson.id)}>
                Reply
              </button>
            )}
            {!readOnly && canModerate && !lesson.hidden ? (
              <button
                type="button"
                className="h-11 px-3 text-sm text-danger-ink"
                onClick={async () => {
                  await hideLessonAction({ postId: lesson.id });
                  router.refresh();
                }}
              >
                Hide
              </button>
            ) : null}
          </div>
          {replyFor === lesson.id && !readOnly ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                await replyToLessonAction({ postId: lesson.id, body: reply });
                setReply('');
                setReplyFor(null);
                router.refresh();
              }}
            >
              <input value={reply} onChange={(e) => setReply(e.target.value)} className="h-11 flex-1 rounded-[4px] border border-line bg-cream px-3 text-sm" />
              <button type="submit" className="h-11 rounded-[4px] bg-secondary px-3 text-sm font-semibold text-primary-deep">
                Send
              </button>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}
