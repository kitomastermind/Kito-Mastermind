import { NotificationBell } from '@/components/kito/NotificationBell';
import { listNotifications, unreadNotificationCount } from '@/server/repositories/notifications';
import { requireActor } from '@/server/supabase/server';

export async function PortalNotifications({ className }: { className?: string }) {
  const actor = await requireActor();
  const [unreadCount, items] = await Promise.all([
    unreadNotificationCount(actor),
    listNotifications(actor),
  ]);
  return <NotificationBell unreadCount={unreadCount} items={items} className={className} />;
}
