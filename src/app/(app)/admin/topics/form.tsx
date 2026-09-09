'use client';

import { createTopicAction } from '@/server/actions/org';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TopicForm({
  topics,
}: {
  topics: { id: string; title: string; month: string; voting_closes_at: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await createTopicAction({ title, description, month, opensAt, votingClosesAt: closesAt });
          router.refresh();
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Prompt" className="min-h-24 w-full rounded-[4px] border border-line bg-cream p-3 text-sm" />
        <input type="date" value={month} onChange={(e) => setMonth(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">Open topic</button>
      </form>
      <ul className="divide-y divide-line rounded-[6px] border border-line">
        {topics.map((topic) => (
          <li key={topic.id} className="px-4 py-3 text-sm">
            {topic.title} · {topic.month}
          </li>
        ))}
      </ul>
    </div>
  );
}
