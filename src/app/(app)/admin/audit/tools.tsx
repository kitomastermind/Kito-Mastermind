'use client';

import { eraseMemberAction, exportMemberAction } from '@/server/actions/data-subject';
import { useState } from 'react';

export function DataSubjectTools({ members }: { members: { id: string; name: string }[] }) {
  const [profileId, setProfileId] = useState(members[0]?.id ?? '');
  const [notice, setNotice] = useState('');
  return (
    <section className="mb-6 space-y-3 rounded-[6px] border border-line bg-cream-flat p-4">
      <p className="text-sm font-semibold">Data subject request</p>
      <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
        {members.map((member) => (
          <option key={member.id} value={member.id}>{member.name}</option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep"
          onClick={async () => {
            const result = await exportMemberAction({ profileId });
            if (!result.ok) {
              setNotice(result.error);
              return;
            }
            const blob = new Blob([JSON.stringify(result.data.payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'kito-member-export.json';
            link.click();
            setNotice('Export downloaded.');
          }}
        >
          Export
        </button>
        <button
          type="button"
          className="h-11 rounded-[4px] border border-line px-4 text-sm"
          onClick={async () => {
            const result = await eraseMemberAction({ profileId });
            setNotice(result.ok ? 'Contact fields erased.' : result.error);
          }}
        >
          Erase contact fields
        </button>
      </div>
      <p className="text-sm text-muted" aria-live="polite">{notice}</p>
    </section>
  );
}
