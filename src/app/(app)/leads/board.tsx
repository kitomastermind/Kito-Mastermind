'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { LeadView, RedactedLead } from '@/server/dto/lead';
import { FilterChipRow } from '@/components/kito/interactive';
import { MoneyText } from '@/components/kito/MatchCard';
import { StatusPill } from '@/components/kito/StatusPill';
import { EmptyState } from '@/components/kito/EmptyState';

function budget(lead: RedactedLead): string | null {
  return lead.budgetMinCents ?? lead.budgetMaxCents;
}

export function LeadsBoard({
  mine,
  pool,
}: {
  mine: LeadView[];
  pool: RedactedLead[];
}) {
  const [tab, setTab] = useState<'mine' | 'pool'>('mine');
  const [status, setStatus] = useState('ALL');
  const filteredMine = useMemo(
    () => mine.filter((row) => (status === 'ALL' ? true : row.status === status)),
    [mine, status],
  );
  const filteredPool = useMemo(
    () => pool.filter((row) => (status === 'ALL' ? true : row.status === status)),
    [pool, status],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChipRow
          options={[
            { id: 'mine', label: 'My leads' },
            { id: 'pool', label: 'Chapter pool' },
          ]}
          value={tab}
          onChange={(id) => setTab(id as 'mine' | 'pool')}
        />
        <Link href="/leads/new" className="inline-flex h-11 items-center rounded-[4px] bg-secondary px-4 font-semibold text-primary-deep">
          Log a lead
        </Link>
      </div>
      <FilterChipRow
        options={[
          { id: 'ALL', label: 'All' },
          { id: 'NEW', label: 'New' },
          { id: 'CONTACTED', label: 'Contacted' },
          { id: 'QUALIFIED', label: 'Qualified' },
          { id: 'UNDER_CONTRACT', label: 'Under contract' },
          { id: 'CLOSED', label: 'Closed' },
          { id: 'LOST', label: 'Lost' },
        ]}
        value={status}
        onChange={setStatus}
      />
      {tab === 'mine' ? (
        filteredMine.length === 0 ? (
          <EmptyState heading="No leads yet" body="Log a buyer or seller to start matching." action={{ label: 'Log a lead', href: '/leads/new' }} />
        ) : (
          <ul className="divide-y divide-line rounded-[6px] border border-line bg-cream-flat">
            {filteredMine.map((lead) => (
              <li key={lead.id}>
                <Link href={`/leads/${lead.id}`} className="flex min-h-11 flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <span>{lead.contactVisible ? lead.clientName : lead.areaLabel}</span>
                  <span className="text-sm text-muted">{lead.leadType}</span>
                  <StatusPill tone="neutral">{lead.status}</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : filteredPool.length === 0 ? (
        <EmptyState heading="No chapter leads yet" body="The pool fills as members log buyers and sellers." />
      ) : (
        <div className="space-y-3 md:space-y-0">
          <div className="hidden grid-cols-8 gap-2 px-4 text-xs tracking-[0.05em] text-muted uppercase md:grid">
            <span>Agent</span>
            <span>Type</span>
            <span>Area</span>
            <span>Budget</span>
            <span>Property</span>
            <span>Timeline</span>
            <span>Status</span>
            <span>Age</span>
          </div>
          <ul className="divide-y divide-line rounded-[6px] border border-line bg-cream-flat">
            {filteredPool.map((lead) => (
              <li key={lead.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-8 md:items-center">
                <span>{lead.ownerName}</span>
                <span>{lead.leadType}</span>
                <span>{lead.areaLabel}</span>
                <span>
                  {(() => {
                    const cents = budget(lead);
                    return cents ? <MoneyText cents={cents} compact /> : '—';
                  })()}
                </span>
                <span>{lead.propertyType ?? '—'}</span>
                <span>{lead.timeline ?? '—'}</span>
                <StatusPill tone="neutral">{lead.status}</StatusPill>
                <span className="text-sm text-muted">{new Date(lead.createdAt).toLocaleDateString('en-KE')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
