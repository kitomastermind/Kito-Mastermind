import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { canCreateTopic } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import { TopicForm } from './form';

export default async function TopicsPage() {
  const actor = await requireActor();
  if (!canCreateTopic(actor, null).allow) redirect('/dashboard');
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from('forum_topics')
    .select('id, title, month, voting_closes_at')
    .order('month', { ascending: false });
  return (
    <>
      <PageHeader eyebrow="Administration" title="Topics" />
      <TopicForm topics={topics ?? []} />
    </>
  );
}
