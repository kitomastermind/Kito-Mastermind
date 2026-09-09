import { PageHeader } from '@/components/kito/PageHeader';
import { EmptyState } from '@/components/kito/EmptyState';
import { requireActor } from '@/server/supabase/server';

export default async function PointsPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Scoreboard" title="Your points" />
      <EmptyState
        heading="Points appear after your first session"
        body="Each entry will show a date, a reason and the points awarded, so you can explain your total."
      />
    </>
  );
}
