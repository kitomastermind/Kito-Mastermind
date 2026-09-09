import { PageHeader } from '@/components/kito/PageHeader';
import { EmptyState } from '@/components/kito/EmptyState';
import { loadPointsPage } from '@/server/repositories/points';
import { requireActor } from '@/server/supabase/server';
import { PointsLedger } from './ledger';

export default async function PointsPage() {
  const actor = await requireActor();
  const model = await loadPointsPage(actor);
  return (
    <>
      <PageHeader eyebrow="Scoreboard" title={`${model.total} / ${model.cap}`} />
      {model.total === 0 && model.categories.every((row) => row.entries.length === 0) ? (
        <EmptyState
          heading="Points appear after your first session"
          body="Each entry will show a date, a reason and the points awarded, so you can explain your total."
        />
      ) : (
        <PointsLedger categories={model.categories} />
      )}
    </>
  );
}
