'use client';

import { useState } from 'react';
import { MatchCard } from '@/components/kito/MatchCard';
import { requestContactAccessAction } from '@/server/actions/access';
import type { DashboardMatch } from '@/server/dto/dashboard';

export function DashboardMatchPreview({ match }: { match: DashboardMatch }) {
  const [state, setState] = useState<'pending' | 'requested' | 'granted' | 'declined'>('pending');
  const [error, setError] = useState('');

  async function onRequest() {
    const result = await requestContactAccessAction({
      leadId: match.otherLeadId,
      matchId: match.matchId,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setState('requested');
  }

  return (
    <div>
      <MatchCard
        ownerName={match.ownerName}
        loggedAt={match.loggedAt}
        chapterName={match.chapterName}
        score={match.score}
        facets={match.facets}
        requestState={state}
        onRequest={state === 'pending' ? onRequest : undefined}
        onMessage={() => {
          window.location.href = `/matches/${match.matchId}`;
        }}
      />
      {error ? (
        <p className="mt-2 text-sm text-danger-ink" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
