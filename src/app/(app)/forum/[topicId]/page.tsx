import { PageHeader } from '@/components/kito/PageHeader';
import { loadTopicById } from '@/server/repositories/forum';
import { requireActor } from '@/server/supabase/server';
import { notFound } from 'next/navigation';
import { LessonFeed } from '../feed';

export default async function ForumTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const actor = await requireActor();
  const { topicId } = await params;
  const model = await loadTopicById(actor, topicId);
  if (!model) notFound();
  return (
    <>
      <PageHeader eyebrow="Archive" title={model.topic.title} />
      <p className="mb-4 text-sm text-muted">{model.topic.description}</p>
      <LessonFeed
        lessons={model.lessons}
        sort="top"
        chapter="all"
        canModerate={false}
        readOnly
      />
    </>
  );
}
