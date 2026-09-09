import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { listChapterMembers, listOpenInvitations } from '@/server/repositories/members';
import { requireActor } from '@/server/supabase/server';
import { MembersRoster } from './roster';

export default async function MembersPage() {
  const actor = await requireActor();
  if (actor.role !== 'ADMIN' && actor.role !== 'CHAPTER_LEAD') redirect('/dashboard');
  const [members, invitations] = await Promise.all([
    listChapterMembers(actor),
    listOpenInvitations(actor),
  ]);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Members" />
      <MembersRoster
        members={members}
        invitations={invitations}
        chapterId={actor.chapterId}
        canInviteAdmin={actor.role === 'ADMIN'}
      />
    </>
  );
}
