'use client';

import { useState } from 'react';
import { ActionItem } from '@/components/kito/interactive';
import { Panel, PanelHead } from '@/components/kito/Panel';
import { StatusPill } from '@/components/kito/StatusPill';
import { EmptyState } from '@/components/kito/EmptyState';
import { formatNairobiDate } from '@/lib/format';
import {
  completeActionAction,
  createActionAction,
} from '@/server/actions/accountability';
import type { AccountabilityActionView, SessionOption } from '@/server/dto/accountability';

function tone(status: string): 'due' | 'overdue' | 'completed' | 'verify' | 'pending' {
  if (status === 'OVERDUE') return 'overdue';
  if (status === 'COMPLETED') return 'verify';
  if (status === 'VERIFIED') return 'completed';
  if (status === 'IN_PROGRESS') return 'pending';
  return 'due';
}

export function MyActionsPanel({
  actions,
  sessions,
  actorId,
  partnerId,
  partnerName,
}: {
  actions: AccountabilityActionView[];
  sessions: SessionOption[];
  actorId: string;
  partnerId: string | null;
  partnerName: string | null;
}) {
  const open = actions.filter((row) => row.status !== 'VERIFIED').length;
  const [error, setError] = useState('');
  const [ownerId, setOwnerId] = useState(actorId);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '');

  async function onComplete(id: string) {
    const result = await completeActionAction({ id });
    if (!result.ok) setError(result.error);
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    const result = await createActionAction({
      ownerId,
      description,
      dueDate,
      sessionId: sessionId || null,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDescription('');
  }

  return (
    <Panel>
      <PanelHead title="Your action steps" count={`${open} of ${actions.length} open`} />
      {actions.length === 0 ? (
        <EmptyState
          heading="No open action steps"
          body="Your next ones come from the next session."
        />
      ) : (
        actions.map((action) => (
          <ActionItem
            key={action.id}
            title={action.description}
            meta={
              action.sessionHeldAt
                ? `From ${formatNairobiDate(action.sessionHeldAt)} session`
                : `Due ${formatNairobiDate(action.dueDate)}`
            }
            checked={action.status === 'COMPLETED' || action.status === 'VERIFIED'}
            strike={action.status === 'COMPLETED' || action.status === 'VERIFIED'}
            onToggle={
              action.status === 'VERIFIED' || action.ownerId !== actorId
                ? undefined
                : () => {
                    void onComplete(action.id);
                  }
            }
            pill={<StatusPill tone={tone(action.status)}>{action.status.replaceAll('_', ' ')}</StatusPill>}
          />
        ))
      )}
      <form onSubmit={onCreate} className="space-y-3 border-t border-line p-4">
        <p className="text-sm font-semibold text-primary">Add an action</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`h-11 rounded-full border px-3 text-sm ${ownerId === actorId ? 'border-secondary bg-secondary-pale' : 'border-line'}`}
            onClick={() => setOwnerId(actorId)}
          >
            Me
          </button>
          {partnerId && partnerName ? (
            <button
              type="button"
              className={`h-11 rounded-full border px-3 text-sm ${ownerId === partnerId ? 'border-secondary bg-secondary-pale' : 'border-line'}`}
              onClick={() => setOwnerId(partnerId)}
            >
              {partnerName}
            </button>
          ) : null}
        </div>
        <input
          required
          minLength={3}
          maxLength={300}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What will be done"
          className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
        />
        <select
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
        >
          <option value="">No session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {formatNairobiDate(session.heldAt)}
            </option>
          ))}
        </select>
        <input
          required
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm"
        />
        {error ? (
          <p className="text-sm text-danger-ink" aria-live="polite">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep"
        >
          Save action
        </button>
      </form>
    </Panel>
  );
}
