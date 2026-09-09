import { EmptyState } from '@/components/kito/EmptyState';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function ForumPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Monthly topic" title="Forum" />
      <EmptyState heading="No topic is open this month yet." body="Lessons appear when your chapter lead opens the month." />
    </>
  );
}
