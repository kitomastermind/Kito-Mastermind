import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { canManageChapters } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import { CycleForm } from './form';

export default async function CyclesPage() {
  const actor = await requireActor();
  if (!canManageChapters(actor).allow) redirect('/dashboard');
  const supabase = await createClient();
  const [{ data: chapters }, { data: cycles }] = await Promise.all([
    supabase.from('chapters').select('id, name').order('name'),
    supabase
      .from('cycles')
      .select('id, name, start_date, end_date, points_cap, chapter_id')
      .order('start_date', { ascending: false }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Cycles" />
      <CycleForm chapters={chapters ?? []} cycles={cycles ?? []} />
    </>
  );
}
