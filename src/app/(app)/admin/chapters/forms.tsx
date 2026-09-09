'use client';

import { createDuesScheduleAction, upsertChapterAction } from '@/server/actions/org';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ChapterForms({
  chapters,
  dues,
}: {
  chapters: { id: string; name: string; code: string; region: string; active: boolean }[];
  dues: { id: string; chapterId: string; amountLabel: string; day: number; from: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('5000');
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '');
  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await upsertChapterAction({ name, code, region: '' });
          router.refresh();
        }}
      >
        <p className="text-sm font-semibold">New chapter</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">Create</button>
      </form>
      <ul className="divide-y divide-line rounded-[6px] border border-line">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="px-4 py-3 text-sm">
            {chapter.name} · {chapter.code} {chapter.active ? '' : '· archived'}
          </li>
        ))}
      </ul>
      <form
        className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await createDuesScheduleAction({
            chapterId,
            amountShillings: amount,
            dayOfMonth: 1,
            effectiveFrom: new Date().toISOString().slice(0, 10),
          });
          router.refresh();
        }}
      >
        <p className="text-sm font-semibold">Dues schedule</p>
        <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
          ))}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">Save schedule</button>
      </form>
      <ul className="text-sm text-muted">
        {dues.map((row) => (
          <li key={row.id}>{row.amountLabel} · day {row.day} from {row.from}</li>
        ))}
      </ul>
    </div>
  );
}
