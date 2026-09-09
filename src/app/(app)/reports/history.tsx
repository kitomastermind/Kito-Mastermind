'use client';

import { voidContributionAction } from '@/server/actions/contributions';
import type { ContributionView } from '@/server/dto/contribution';
import { StatusPill } from '@/components/kito/StatusPill';
import { formatNairobiDate } from '@/lib/format';
import { useState } from 'react';

export function HistoryTable({ rows, canVoid }: { rows: ContributionView[]; canVoid: boolean }) {
  const [error, setError] = useState('');
  const page = rows.slice(0, 20);
  return (
    <div>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-2">Date</th>
              <th>Description</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {page.map((row) => (
              <tr
                key={row.id}
                title={row.voidReason ?? undefined}
                className={row.voidedAt ? 'text-muted line-through' : ''}
              >
                <td className="py-2">{formatNairobiDate(row.paidAt ?? row.createdAt)}</td>
                <td>{row.description}</td>
                <td>{row.method ?? '—'}</td>
                <td className="text-right">{row.amountLabel}</td>
                <td>
                  <StatusPill tone={row.status === 'PAID' ? 'paid' : 'pending'}>{row.status}</StatusPill>
                  {!row.voidedAt && canVoid ? (
                    <button
                      type="button"
                      className="ml-2 text-xs text-danger-ink"
                      onClick={async () => {
                        const reason = window.prompt('Void reason');
                        if (!reason) return;
                        const result = await voidContributionAction({ id: row.id, reason });
                        if (!result.ok) setError(result.error);
                      }}
                    >
                      Void
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 md:hidden">
        {page.map((row) => (
          <article
            key={row.id}
            title={row.voidReason ?? undefined}
            className={`rounded-[6px] border border-line p-3 ${row.voidedAt ? 'text-muted line-through' : ''}`}
          >
            <p className="text-sm font-semibold">{row.description}</p>
            <p className="text-xs text-muted">{formatNairobiDate(row.paidAt ?? row.createdAt)}</p>
            <p className="mt-1 text-sm">
              {row.amountLabel} · {row.method ?? '—'}
            </p>
            <StatusPill tone={row.status === 'PAID' ? 'paid' : 'pending'}>{row.status}</StatusPill>
          </article>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-danger-ink">{error}</p> : null}
    </div>
  );
}
