import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { canManageChapters } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import { formatKES } from '@/server/services/money';
import { ChapterForms } from './forms';

export default async function ChaptersPage() {
  const actor = await requireActor();
  if (!canManageChapters(actor).allow) redirect('/dashboard');
  const supabase = await createClient();
  const [{ data: chapters }, { data: dues }] = await Promise.all([
    supabase.from('chapters').select('id, name, code, region, active').order('name'),
    supabase
      .from('dues_schedules')
      .select('id, chapter_id, amount, day_of_month, effective_from')
      .order('effective_from', { ascending: false }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Chapters and dues" />
      <ChapterForms
        chapters={(chapters ?? []).map((row) => ({
          ...row,
          region: row.region ?? '',
        }))}
        dues={(dues ?? []).map((row) => ({
          id: row.id,
          chapterId: row.chapter_id,
          amountLabel: formatKES(BigInt(String(row.amount))),
          day: row.day_of_month,
          from: row.effective_from,
        }))}
      />
    </>
  );
}
