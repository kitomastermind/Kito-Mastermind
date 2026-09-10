import { Suspense } from 'react';
import { NotificationBell } from '@/components/kito/NotificationBell';
import { PortalShell } from '@/components/layout/PortalShell';
import { createClient, requireActor } from '@/server/supabase/server';
import { PortalNotifications } from './portal-notifications';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from('chapters')
    .select('name')
    .eq('id', actor.chapterId)
    .maybeSingle();

  return (
    <PortalShell
      fullName={actor.fullName}
      chapterName={chapter?.name ?? 'Chapter'}
      role={actor.role}
      canAdmin={actor.role === 'ADMIN' || actor.role === 'CHAPTER_LEAD'}
      desktopBell={
        <Suspense fallback={<NotificationBell unreadCount={0} items={[]} className="text-[#E8F0EA]" />}>
          <PortalNotifications className="text-[#E8F0EA]" />
        </Suspense>
      }
      mobileBell={
        <Suspense fallback={<NotificationBell unreadCount={0} items={[]} />}>
          <PortalNotifications />
        </Suspense>
      }
    >
      {children}
    </PortalShell>
  );
}
