'use client';

import { useState } from 'react';
import { requestPairingAction } from '@/server/actions/accountability';

export function RequestPairingButton() {
  const [message, setMessage] = useState('');
  return (
    <button
      type="button"
      className="inline-flex h-11 items-center rounded-[4px] border border-line px-4 text-sm"
      onClick={async () => {
        const result = await requestPairingAction({ reason: 'Requesting a new pairing for the next cycle.' });
        setMessage(result.ok ? 'Request sent to your chapter lead. Nobody was unpaired.' : result.error);
      }}
    >
      {message || 'Request new pairing'}
    </button>
  );
}
