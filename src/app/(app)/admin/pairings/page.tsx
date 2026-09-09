import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { canAssignPairings } from '@/server/policy';
import { loadPairingBoard } from '@/server/repositories/accountability';
import { requireActor } from '@/server/supabase/server';
import { PairingsBoard } from './board';

export default async function PairingsPage() {
  const actor = await requireActor();
  const decision = canAssignPairings(actor, actor.chapterId);
  if (!decision.allow) redirect('/dashboard');
  const board = await loadPairingBoard(actor);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Pairings" />
      <PairingsBoard
        members={board.members}
        history={board.history}
        current={board.current}
        requests={board.requests}
        cycleId={board.cycleId}
      />
    </>
  );
}
