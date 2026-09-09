import { EmptyState } from '@/components/kito/EmptyState';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function NotificationsPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Inbox" title="Notifications" />
      <EmptyState heading="You are caught up" body="New matches, access requests and nudges will appear here." />
    </>
  );
}
