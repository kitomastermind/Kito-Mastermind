'use client';

import { sendMatchMessageAction } from '@/server/actions/messages';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function MatchThread({
  matchId,
  messages,
}: {
  matchId: string;
  messages: { id: string; author: string; body: string; sentAt: string }[];
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {messages.map((message) => (
          <li key={message.id} className="rounded-[6px] border border-line bg-cream-flat p-3">
            <p className="text-xs text-muted">{message.author} · {message.sentAt}</p>
            <p className="text-sm">{message.body}</p>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await sendMatchMessageAction({ matchId, body });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setBody('');
          router.refresh();
        }}
      >
        <input value={body} onChange={(e) => setBody(e.target.value)} aria-label="Message" className="h-11 flex-1 rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">
          Send
        </button>
      </form>
      {error ? <p className="text-sm text-danger-ink">{error}</p> : null}
    </div>
  );
}
