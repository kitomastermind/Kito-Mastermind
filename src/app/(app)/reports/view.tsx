'use client';

import { useMemo, useState } from 'react';
import { Panel, PanelHead } from '@/components/kito/Panel';
import { StatCard } from '@/components/kito/StatCard';
import { FilterChipRow } from '@/components/kito/interactive';
import type { ContributionView, MonthBar, StatementArchiveItem } from '@/server/dto/contribution';
import { HistoryTable } from './history';
import { StatementPanel } from './statements';
import { TreasurerPanel } from './treasurer';
import { PayMpesaButton } from './pay-mpesa';

export function ReportsView({
  stats,
  rows,
  months,
  archive,
  members,
  showTreasurer,
  showChapterReport,
  mpesaConfigured,
}: {
  stats: {
    cycleLabel: string;
    cycleSub: string;
    allTimeLabel: string;
    outstandingLabel: string;
    outstandingSub: string;
    outstandingWarn: boolean;
    chapterCycleLabel: string;
  };
  rows: ContributionView[];
  months: MonthBar[];
  archive: StatementArchiveItem[];
  members: { id: string; name: string }[];
  showTreasurer: boolean;
  showChapterReport: boolean;
  mpesaConfigured: boolean;
}) {
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (type !== 'ALL' && row.type !== type) return false;
        if (status === 'PAID' && row.status !== 'PAID') return false;
        if (status === 'PENDING' && row.status !== 'PENDING') return false;
        return true;
      }),
    [rows, type, status],
  );
  const max = Math.max(1, ...months.map((row) => row.shillings));

  return (
    <div className="space-y-6">
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
        <StatCard label="Contributed This Cycle" value={stats.cycleLabel} sub={stats.cycleSub} />
        <StatCard label="Contributed All-Time" value={stats.allTimeLabel} />
        <StatCard
          label="Outstanding Balance"
          value={stats.outstandingLabel}
          sub={stats.outstandingSub}
          subTone={stats.outstandingWarn ? 'warn' : 'default'}
        />
        <StatCard label="Chapter Total (Cycle)" value={stats.chapterCycleLabel} />
      </div>
      <Panel>
        <PanelHead title="History" count={`View all ${rows.length}`} />
        <div className="space-y-3 p-4">
          <FilterChipRow
            options={[
              { id: 'ALL', label: 'All' },
              { id: 'DUES', label: 'Dues' },
              { id: 'FINE', label: 'Fines' },
              { id: 'EVENT_FEE', label: 'Event Fees' },
              { id: 'DONATION', label: 'Donations' },
            ]}
            value={type}
            onChange={setType}
          />
          <FilterChipRow
            options={[
              { id: 'ALL', label: 'All statuses' },
              { id: 'PAID', label: 'Paid' },
              { id: 'PENDING', label: 'Pending' },
            ]}
            value={status}
            onChange={setStatus}
          />
          <HistoryTable rows={filtered} canVoid={showTreasurer} />
        </div>
      </Panel>
      <Panel>
        <PanelHead title="Chapter contributions by month" />
        <div className="flex h-40 items-end gap-2 p-4">
          {months.map((row) => (
            <div key={row.month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-secondary"
                style={{ height: `${Math.max(8, (row.shillings / max) * 100)}%` }}
                title={`${row.month}: ${row.shillings}`}
              />
              <span className="text-[10px] text-muted">{row.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </Panel>
      <StatementPanel archive={archive} showChapterReport={showChapterReport} />
      {showTreasurer ? <TreasurerPanel members={members} /> : null}
      {rows.some((row) => row.status === 'PENDING' && !row.voidedAt) ? (
        <Panel>
          <PanelHead title="Pay with M-Pesa" />
          <div className="space-y-3 p-4">
            {rows
              .filter((row) => row.status === 'PENDING' && !row.voidedAt)
              .map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">
                    {row.description} · {row.amountLabel}
                  </p>
                  <PayMpesaButton contributionId={row.id} enabled={mpesaConfigured} />
                </div>
              ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
