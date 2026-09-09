import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function AdminPage() {
  const actor = await requireActor();
  if (actor.role !== 'ADMIN' && actor.role !== 'CHAPTER_LEAD') {
    redirect('/dashboard');
  }
  return <PageHeader eyebrow="Administration" title="Chapter admin" />;
}
