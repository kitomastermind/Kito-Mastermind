'use client';

import { upsertLessonAction } from '@/server/actions/forum';
import type { LessonView } from '@/server/repositories/forum';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Composer({
  topicId,
  closed,
  existing,
}: {
  topicId: string;
  closed: boolean;
  existing: LessonView | null;
}) {
  const router = useRouter();
  const [headline, setHeadline] = useState(existing?.headline ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [error, setError] = useState('');
  if (closed && !existing) return null;
  return (
    <form
      className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await upsertLessonAction({ topicId, headline, body });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      }}
    >
      <p className="text-xs font-semibold tracking-[0.05em] text-muted uppercase">This month</p>
      <input
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        placeholder="What's the one-line takeaway?"
        disabled={closed}
        className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share what worked. Be specific enough that someone could try it this week."
        disabled={closed}
        className="min-h-32 w-full rounded-[4px] border border-line bg-cream p-3 text-sm"
      />
      {error ? <p className="text-sm text-danger-ink">{error}</p> : null}
      <button
        type="submit"
        disabled={closed}
        className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep disabled:opacity-50"
      >
        {existing ? 'Save lesson' : 'Post lesson'}
      </button>
    </form>
  );
}
