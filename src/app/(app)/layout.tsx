import { PortalShell } from '@/components/layout/PortalShell';
import { listNotifications, unreadNotificationCount } from '@/server/repositories/notifications';
import { createClient, requireActor } from '@/server/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const supabase = await createClient();
  const [profileResult, unreadCount, latest] = await Promise.all([
    supabase.from('profiles').select('full_name, chapter_id, chapters(name)').eq('id', actor.id).single(),
    unreadNotificationCount(actor),
    listNotifications(actor),
  ]);
  const profile = profileResult.data;
  const chapterName =
    profile?.chapters && typeof profile.chapters === 'object' && 'name' in profile.chapters
      ? String(profile.chapters.name)
      : 'Chapter';

  return (
    <PortalShell
      fullName={actor.fullName}
      chapterName={chapterName}
      role={actor.role}
      unreadCount={unreadCount}
      notifications={latest}
      canAdmin={actor.role === 'ADMIN' || actor.role === 'CHAPTER_LEAD'}
    >
      {children}
    </PortalShell>
  );
}
