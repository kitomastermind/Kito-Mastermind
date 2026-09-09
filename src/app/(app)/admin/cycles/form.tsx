'use client';

import { createCycleAction } from '@/server/actions/org';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CycleForm({
  chapters,
  cycles,
}: {
  chapters: { id: string; name: string }[];
  cycles: { id: string; name: string; start_date: string; end_date: string; points_cap: number }[];
}) {
  const router = useRouter();
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '');
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await createCycleAction({ chapterId, name, start, end, pointsCap: 600 });
          router.refresh();
        }}
      >
        <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
          ))}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 2026" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">Create cycle</button>
      </form>
      <ul className="divide-y divide-line rounded-[6px] border border-line">
        {cycles.map((cycle) => (
          <li key={cycle.id} className="px-4 py-3 text-sm">
            {cycle.name} · {cycle.start_date} – {cycle.end_date} · cap {cycle.points_cap}
          </li>
        ))}
      </ul>
    </div>
  );
}
