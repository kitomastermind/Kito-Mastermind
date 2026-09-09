'use client';

import { useState } from 'react';
import { allocatePaymentAction } from '@/server/actions/payments';

export function PaymentsQueue({
  payments,
  contributions,
}: {
  payments: { id: string; phone: string; amountLabel: string; reference: string; receipt: string }[];
  contributions: { id: string; label: string }[];
}) {
  const [message, setMessage] = useState('');
  if (payments.length === 0) {
    return <p className="text-sm text-muted">No unallocated M-Pesa payments.</p>;
  }
  return (
    <ul className="space-y-3">
      {payments.map((payment) => (
        <li key={payment.id} className="rounded-[6px] border border-line bg-cream-flat p-4">
          <p className="text-sm">
            {payment.amountLabel} · {payment.phone} · {payment.reference}
          </p>
          <p className="text-xs text-muted">{payment.receipt}</p>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await allocatePaymentAction({
                paymentId: payment.id,
                contributionId: String(form.get('contributionId')),
              });
              setMessage(result.ok ? 'Allocated and audited.' : result.error);
            }}
          >
            <select name="contributionId" required className="h-11 min-w-48 rounded-[4px] border border-line bg-cream px-3 text-sm">
              {contributions.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
            <button type="submit" className="h-11 rounded-[4px] bg-secondary px-3 text-sm font-semibold text-primary-deep">
              Allocate
            </button>
          </form>
          {message ? <p className="mt-2 text-sm">{message}</p> : null}
        </li>
      ))}
    </ul>
  );
}
