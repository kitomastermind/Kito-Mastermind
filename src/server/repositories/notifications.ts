import type { Actor } from '@/server/policy';
import type { NotificationType } from '@/server/services/notification-copy';
import { createClient } from '@/server/supabase/server';

export type NotificationDto = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(actor: Actor): Promise<NotificationDto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link_path, read_at, created_at')
    .eq('profile_id', actor.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function unreadNotificationCount(actor: Actor): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', actor.id)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}
