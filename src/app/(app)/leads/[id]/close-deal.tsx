'use client';

import { createDealAction } from '@/server/actions/deals';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CloseDealForm({
  leadId,
  actorId,
  members,
}: {
  leadId: string;
  actorId: string;
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [volume, setVolume] = useState('');
  const [closedAt, setClosedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [otherId, setOtherId] = useState('');
  const [otherShare, setOtherShare] = useState('0');
  const [error, setError] = useState('');
  const other = Number(otherShare);
  const mine = Number.isFinite(other) ? 100 - other : 100;
  return (
    <form
      className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const participants: { profileId: string; role: 'CLOSER' | 'REFERRER'; creditShare: number }[] = [
          { profileId: actorId, role: 'CLOSER', creditShare: mine },
        ];
        if (otherId) {
          participants.push({
            profileId: otherId,
            role: 'REFERRER',
            creditShare: other,
          });
        }
        const result = await createDealAction({
          leadId,
          saleVolume: volume,
          closedAt,
          participants,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      }}
    >
      <p className="text-sm font-semibold text-ink">Log closed business</p>
      <input
        value={volume}
        onChange={(e) => setVolume(e.target.value)}
        placeholder="Sale volume, e.g. 42.6m"
        className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
      />
      <input
        type="date"
        value={closedAt}
        onChange={(e) => setClosedAt(e.target.value)}
        className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
      />
      <select
        value={otherId}
        onChange={(e) => setOtherId(e.target.value)}
        className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
      >
        <option value="">No split — 100% to you</option>
        {members
          .filter((member) => member.id !== actorId)
          .map((member) => (
            <option key={member.id} value={member.id}>
              Split with {member.name}
            </option>
          ))}
      </select>
      {otherId ? (
        <input
          value={otherShare}
          onChange={(e) => setOtherShare(e.target.value)}
          placeholder="Their credit share %"
          className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
        />
      ) : null}
      {error ? <p className="text-sm text-danger-ink">{error}</p> : null}
      <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">
        Propose split
      </button>
    </form>
  );
}
