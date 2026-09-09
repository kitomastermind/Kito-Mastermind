import { PageHeader } from '@/components/kito/PageHeader';
import { loadForumHome } from '@/server/repositories/forum';
import { requireActor } from '@/server/supabase/server';
import { ForumView } from './view';

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; chapter?: string }>;
}) {
  const actor = await requireActor();
  const params = await searchParams;
  const sort = params.sort === 'recent' ? 'recent' : 'top';
  const chapter = params.chapter === 'all' ? 'all' : 'mine';
  const model = await loadForumHome(actor, sort, chapter);
  return (
    <>
      <PageHeader eyebrow="Monthly topic" title="Forum" />
      <ForumView model={model} sort={sort} chapter={chapter} actorId={actor.id} canModerate={actor.role === 'CHAPTER_LEAD' || actor.role === 'ADMIN'} />
    </>
  );
}
