import { EmptyState } from '@/components/kito/EmptyState';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function AccountabilityPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Follow-through" title="Accountability" />
      <EmptyState
        heading="No open action steps"
        body="Your next ones come from the next session."
      />
    </>
  );
}
