'use client';

import { createSessionAction, markAttendanceAction } from '@/server/actions/org';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SessionRoster({
  sessions,
  members,
  attendance,
  topics,
}: {
  sessions: { id: string; held_at: string; notes: string | null }[];
  members: { id: string; full_name: string }[];
  attendance: { session_id: string; profile_id: string; present: boolean; late: boolean }[];
  topics: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [heldAt, setHeldAt] = useState('');
  const [topicId, setTopicId] = useState('');
  const current = sessions[0];
  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await createSessionAction({ heldAt, topicId: topicId || null, notes: '' });
          router.refresh();
        }}
      >
        <input type="datetime-local" value={heldAt} onChange={(e) => setHeldAt(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
          <option value="">No topic</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>{topic.title}</option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">Create session</button>
      </form>
      {current ? (
        <div>
          <p className="mb-3 text-sm font-semibold">Attendance · {current.held_at}</p>
          <ul className="divide-y divide-line rounded-[6px] border border-line">
            {members.map((member) => {
              const row = attendance.find((item) => item.session_id === current.id && item.profile_id === member.id);
              return (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm">{member.full_name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`h-11 min-w-20 rounded-[4px] px-3 text-sm ${row?.present ? 'bg-secondary text-primary-deep' : 'border border-line'}`}
                      onClick={async () => {
                        await markAttendanceAction({ sessionId: current.id, profileId: member.id, present: true, late: false });
                        router.refresh();
                      }}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      className={`h-11 min-w-20 rounded-[4px] px-3 text-sm ${row?.late ? 'bg-danger-pale text-danger-ink' : 'border border-line'}`}
                      onClick={async () => {
                        await markAttendanceAction({ sessionId: current.id, profileId: member.id, present: true, late: true });
                        router.refresh();
                      }}
                    >
                      Late
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
