import { PageHeader } from '@/components/kito/PageHeader';
import { canRecordContribution, canViewChapterLedger } from '@/server/policy';
import {
  listMyContributions,
  loadChapterMonthBars,
  loadStatementArchive,
  listChapterMembers,
  reportsStats,
} from '@/server/repositories/contributions';
import { createClient, requireActor } from '@/server/supabase/server';
import { mpesaEnabled } from '@/server/services/mpesa';
import { sumCents } from '@/server/services/money';
import { ReportsView } from './view';

export default async function ReportsPage() {
  const actor = await requireActor();
  const rows = await listMyContributions(actor);
  const months = await loadChapterMonthBars();
  const archive = await loadStatementArchive(actor);
  const members = canRecordContribution(actor, actor.chapterId).allow
    ? await listChapterMembers(actor)
    : [];
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: cycle } = await supabase
    .from('cycles')
    .select('start_date, end_date')
    .eq('chapter_id', actor.chapterId)
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();
  const start = cycle?.start_date ?? '2026-07-01';
  const end = cycle?.end_date ?? '2026-09-30';
  const chapterCents = sumCents(
    months.map((row) => BigInt(row.shillings) * BigInt(100)),
  );
  const stats = reportsStats(rows, start, end, chapterCents);
  return (
    <>
      <PageHeader eyebrow="Ledger" title="Contributions and reports" />
      <ReportsView
        stats={stats}
        rows={rows}
        months={months}
        archive={archive}
        members={members}
        showTreasurer={canRecordContribution(actor, actor.chapterId).allow}
        showChapterReport={canViewChapterLedger(actor, actor.chapterId).allow}
        mpesaConfigured={mpesaEnabled()}
      />
    </>
  );
}
