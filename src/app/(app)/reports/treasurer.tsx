'use client';

import { useState } from 'react';
import { Panel, PanelHead } from '@/components/kito/Panel';
import { StatusPill } from '@/components/kito/StatusPill';
import { recordContributionAction } from '@/server/actions/contributions';

export function TreasurerPanel({ members }: { members: { id: string; name: string }[] }) {
  const [message, setMessage] = useState('');
  return (
    <Panel>
      <PanelHead title="Record a contribution" />
      <div className="flex items-center gap-2 px-4 pt-3">
        <StatusPill tone="verify">Treasurer</StatusPill>
      </div>
      <form
        className="space-y-3 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await recordContributionAction({
            profileId: String(form.get('profileId')),
            type: String(form.get('type')),
            amountShillings: String(form.get('amount')),
            method: String(form.get('method')),
            date: String(form.get('date')),
            description: String(form.get('description')),
          });
          setMessage(
            result.ok ? 'Contribution recorded and added to the chapter ledger.' : result.error,
          );
        }}
      >
        <select name="profileId" required className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select name="type" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
          <option value="DUES">Dues</option>
          <option value="FINE">Fine</option>
          <option value="EVENT_FEE">Event fee</option>
          <option value="DONATION">Donation</option>
        </select>
        <input name="amount" required placeholder="Amount in KES" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <select name="method" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
          <option value="MPESA">M-Pesa</option>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
        </select>
        <input name="date" type="date" required className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <input name="description" required minLength={3} placeholder="Description" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">
          Record
        </button>
        {message ? <p className="text-sm" aria-live="polite">{message}</p> : null}
      </form>
    </Panel>
  );
}
