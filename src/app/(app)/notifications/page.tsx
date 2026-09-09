import { EmptyState } from '@/components/kito/EmptyState';
import { PageHeader } from '@/components/kito/PageHeader';
import { listNotifications } from '@/server/repositories/notifications';
import { requireActor } from '@/server/supabase/server';
import { NotificationList } from './list';

export default async function NotificationsPage() {
  const actor = await requireActor();
  const items = await listNotifications(actor);
  return (
    <>
      <PageHeader eyebrow="Inbox" title="Notifications" />
      {items.length === 0 ? (
        <EmptyState
          heading="You are caught up"
          body="New matches, access requests and nudges will appear here."
        />
      ) : (
        <NotificationList items={items} />
      )}
    </>
  );
}
