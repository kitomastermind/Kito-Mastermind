'use client';

import { useState } from 'react';
import { ActionItem } from '@/components/kito/interactive';
import { Panel, PanelHead } from '@/components/kito/Panel';
import { StatusPill } from '@/components/kito/StatusPill';
import { EmptyState } from '@/components/kito/EmptyState';
import { formatNairobiDate, firstName } from '@/lib/format';
import { nudgeActionAction, verifyActionAction } from '@/server/actions/accountability';
import type { AccountabilityActionView } from '@/server/dto/accountability';

function tone(status: string): 'due' | 'overdue' | 'completed' | 'verify' | 'pending' {
  if (status === 'OVERDUE') return 'overdue';
  if (status === 'COMPLETED') return 'verify';
  if (status === 'VERIFIED') return 'completed';
  return 'pending';
}

function nudgedToday(nudgedAt: string | null, now: Date): boolean {
  if (!nudgedAt) return false;
  return now.getTime() - new Date(nudgedAt).getTime() < 24 * 60 * 60 * 1000;
}

export function PartnerActionsPanel({
  actions,
  partnerName,
}: {
  actions: AccountabilityActionView[];
  partnerName: string;
}) {
  const [error, setError] = useState('');
  const overdue = actions.filter((row) => row.status === 'OVERDUE').length;
  const now = new Date();

  return (
    <Panel>
      <PanelHead title={`Tracking for ${firstName(partnerName)}`} count={overdue ? `${overdue} overdue` : undefined} />
      {actions.length === 0 ? (
        <EmptyState
          heading="Nothing to track yet"
          body="When your partner logs an action, Verify and Nudge appear here — never on your own rows."
        />
      ) : (
        actions.map((action) => {
          const recentNudge = nudgedToday(action.nudgedAt, now);
          return (
            <ActionItem
              key={action.id}
              title={action.description}
              meta={
                action.sessionHeldAt
                  ? `From ${formatNairobiDate(action.sessionHeldAt)} session`
                  : `Due ${formatNairobiDate(action.dueDate)}`
              }
              checked={action.status === 'COMPLETED' || action.status === 'VERIFIED'}
              strike={action.status === 'VERIFIED'}
              pill={<StatusPill tone={tone(action.status)}>{action.status.replaceAll('_', ' ')}</StatusPill>}
              rightButton={
                <div className="flex flex-col gap-2">
                  {action.status === 'COMPLETED' ? (
                    <button
                      type="button"
                      className="h-11 rounded-[4px] bg-secondary px-3 text-sm font-semibold text-primary-deep"
                      onClick={async () => {
                        const result = await verifyActionAction({ id: action.id });
                        if (!result.ok) setError(result.error);
                      }}
                    >
                      Verify
                    </button>
                  ) : null}
                  {action.status === 'OVERDUE' ? (
                    <button
                      type="button"
                      disabled={recentNudge}
                      className="h-11 rounded-[4px] bg-danger-pale px-3 text-sm font-semibold text-danger-ink disabled:opacity-60"
                      onClick={async () => {
                        const result = await nudgeActionAction({ id: action.id });
                        if (!result.ok) setError(result.error);
                      }}
                    >
                      {recentNudge ? 'Nudged today' : 'Nudge'}
                    </button>
                  ) : null}
                </div>
              }
            />
          );
        })
      )}
      {error ? (
        <p className="px-4 py-2 text-sm text-danger-ink" aria-live="polite">
          {error}
        </p>
      ) : null}
    </Panel>
  );
}
