'use client';

import { useMemo, useState } from 'react';
import { assignPairingsAction } from '@/server/actions/pairings';
import { suggestPairings, type PairHistory, type PairingMember, type SuggestedGroup } from '@/server/services/suggest-pairings';

export function PairingsBoard({
  members,
  history,
  current,
  requests,
  cycleId,
}: {
  members: PairingMember[];
  history: PairHistory[];
  current: { id: string; a: string; b: string; aName: string; bName: string }[];
  requests: { id: string; name: string; reason: string | null; createdAt: string }[];
  cycleId: string | null;
}) {
  const [groups, setGroups] = useState<SuggestedGroup[]>(() =>
    current.map((row) => ({
      memberIds: [row.a, row.b],
      kind: 'pair' as const,
      cyclesSince: history.find((item) => item.a === row.a && item.b === row.b)?.cyclesAgo ?? null,
    })),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const assigned = new Set(groups.flatMap((group) => group.memberIds));
  const unpaired = members.filter((row) => !assigned.has(row.id));
  const names = useMemo(() => new Map(members.map((row) => [row.id, row.name])), [members]);

  function pairWith(targetId: string) {
    if (!selected || selected === targetId) {
      setSelected(targetId);
      return;
    }
    setGroups((currentGroups) => [
      ...currentGroups.filter(
        (group) => !group.memberIds.includes(selected) && !group.memberIds.includes(targetId),
      ),
      {
        memberIds: [selected, targetId],
        kind: 'pair',
        cyclesSince:
          history.find(
            (item) =>
              (item.a === selected && item.b === targetId) || (item.b === selected && item.a === targetId),
          )?.cyclesAgo ?? null,
      },
    ]);
    setSelected(null);
  }

  async function onConfirm() {
    if (!cycleId) {
      setError('No cycle is open.');
      return;
    }
    const pairs = groups.filter((group) => group.kind === 'pair').map((group) => [group.memberIds[0] ?? '', group.memberIds[1] ?? ''] as [string, string]);
    const triples = groups
      .filter((group) => group.kind === 'triple')
      .map((group) => [group.memberIds[0] ?? '', group.memberIds[1] ?? '', group.memberIds[2] ?? ''] as [string, string, string]);
    const result = await assignPairingsAction({ cycleId, pairs, triples });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage('Pairings saved.');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-11 rounded-[4px] border border-line px-3 text-sm"
            onClick={() => setGroups(suggestPairings(members, history))}
          >
            Suggest pairings
          </button>
          <button
            type="button"
            className="h-11 rounded-[4px] bg-secondary px-3 text-sm font-semibold text-primary-deep"
            onClick={() => {
              void onConfirm();
            }}
          >
            Confirm assignment
          </button>
        </div>
        {unpaired.length === 1 ? (
          <p className="rounded-[4px] bg-danger-pale px-3 py-2 text-sm text-danger-ink">
            Odd count: {names.get(unpaired[0]?.id ?? '')} is ungrouped. Use Suggest to form a group of three.
          </p>
        ) : null}
        <ul className="space-y-2">
          {groups.map((group) => (
            <li
              key={group.memberIds.join('-')}
              className="rounded-[6px] border border-line bg-cream-flat p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const id = event.dataTransfer.getData('text/plain');
                if (id) pairWith(id);
              }}
            >
              <p className="text-sm font-semibold text-primary">
                {group.kind === 'triple' ? 'Group of three' : 'Pair'}
              </p>
              <p className="text-sm text-ink">
                {group.memberIds.map((id) => names.get(id) ?? id).join(' · ')}
              </p>
              {group.cyclesSince !== null ? (
                <p className="mt-1 text-xs text-danger-ink">
                  Repeat pairing · last together {group.cyclesSince} cycle{group.cyclesSince === 1 ? '' : 's'} ago
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {unpaired.map((member) => (
            <button
              key={member.id}
              type="button"
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', member.id)}
              onClick={() => pairWith(member.id)}
              className={`h-11 rounded-full border px-3 text-sm ${selected === member.id ? 'border-secondary bg-secondary-pale' : 'border-line'}`}
            >
              {member.name}
            </button>
          ))}
        </div>
        {error ? <p className="text-sm text-danger-ink">{error}</p> : null}
        {message ? <p className="text-sm text-secondary-deep">{message}</p> : null}
      </section>
      <aside className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4">
        <h2 className="font-display text-lg text-primary">Pairing requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted">No open requests. Requesting a pairing never unpairs anyone.</p>
        ) : (
          requests.map((row) => (
            <p key={row.id} className="text-sm">
              {row.name} · {row.createdAt}
              {row.reason ? ` · ${row.reason}` : ''}
            </p>
          ))
        )}
      </aside>
    </div>
  );
}
