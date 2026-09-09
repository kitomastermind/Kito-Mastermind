'use client';

import { useState } from 'react';
import { payWithMpesaAction } from '@/server/actions/contributions';

export function PayMpesaButton({
  contributionId,
  enabled,
}: {
  contributionId: string;
  enabled: boolean;
}) {
  const [state, setState] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        title="M-Pesa is not configured yet. Ask your treasurer to record the payment."
        className="h-11 rounded-[4px] bg-line px-3 text-sm text-muted"
      >
        Pay with M-Pesa
      </button>
    );
  }
  return (
    <div>
      <button
        type="button"
        className="h-11 rounded-[4px] bg-secondary px-3 text-sm font-semibold text-primary-deep"
        onClick={async () => {
          setState('waiting');
          const result = await payWithMpesaAction({ contributionId });
          if (!result.ok) {
            setState('error');
            setMessage(result.error);
            return;
          }
          setState('done');
          setMessage('Check your phone. Enter your M-Pesa PIN to complete.');
        }}
      >
        {state === 'waiting' ? 'Sending…' : 'Pay with M-Pesa'}
      </button>
      {message ? <p className="mt-1 text-xs text-muted">{message}</p> : null}
    </div>
  );
}
