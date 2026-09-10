import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { canCreateSession } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import { SessionRoster } from './roster';

export default async function SessionsPage() {
  const actor = await requireActor();
  if (!canCreateSession(actor, actor.chapterId).allow) redirect('/dashboard');
  const supabase = await createClient();
  const [{ data: sessions }, { data: members }, { data: attendance }, { data: topics }] = await Promise.all([
    supabase
      .from('mastermind_sessions')
      .select('id, held_at, notes')
      .eq('chapter_id', actor.chapterId)
      .order('held_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('chapter_id', actor.chapterId)
      .eq('active', true)
      .order('full_name'),
    supabase.from('session_attendance').select('session_id, profile_id, present, late'),
    supabase.from('forum_topics').select('id, title').order('month', { ascending: false }).limit(12),
  ]);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Sessions" />
      <SessionRoster
        sessions={sessions ?? []}
        members={members ?? []}
        attendance={attendance ?? []}
        topics={topics ?? []}
      />
    </>
  );
}
