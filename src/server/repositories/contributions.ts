import type { Actor } from '@/server/policy';
import { formatKES, sumCents, type Cents } from '@/server/services/money';
import { createClient } from '@/server/supabase/server';
import type {
  ContributionType,
  ContributionView,
  MonthBar,
  PaymentMethod,
  PaymentStatus,
  ReportsStats,
  StatementArchiveItem,
} from '@/server/dto/contribution';

function asType(value: string): ContributionType {
  if (value === 'DUES' || value === 'FINE' || value === 'EVENT_FEE' || value === 'DONATION') {
    return value;
  }
  return 'DUES';
}

function asMethod(value: string | null): PaymentMethod | null {
  if (value === 'MPESA' || value === 'CASH' || value === 'BANK_TRANSFER') return value;
  return null;
}

function asStatus(value: string): PaymentStatus {
  if (value === 'PENDING' || value === 'PAID' || value === 'FAILED' || value === 'REVERSED') {
    return value;
  }
  return 'PENDING';
}

function toView(row: {
  id: string;
  profile_id: string;
  chapter_id: string;
  type: string;
  description: string;
  amount: number | string;
  method: string | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  period_key: string | null;
  created_at: string;
}): ContributionView {
  const amountCents = BigInt(String(row.amount));
  return {
    id: row.id,
    profileId: row.profile_id,
    chapterId: row.chapter_id,
    type: asType(row.type),
    description: row.description,
    amountCents: amountCents.toString(),
    amountLabel: formatKES(amountCents),
    method: asMethod(row.method),
    status: asStatus(row.status),
    dueDate: row.due_date,
    paidAt: row.paid_at,
    voidedAt: row.voided_at,
    voidReason: row.void_reason,
    periodKey: row.period_key,
    createdAt: row.created_at,
  };
}

export async function listMyContributions(actor: Actor): Promise<ContributionView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contributions')
    .select(
      'id, profile_id, chapter_id, type, description, amount, method, status, due_date, paid_at, voided_at, void_reason, period_key, created_at',
    )
    .eq('profile_id', actor.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toView);
}

export async function getContribution(actor: Actor, id: string): Promise<ContributionView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contributions')
    .select(
      'id, profile_id, chapter_id, type, description, amount, method, status, due_date, paid_at, voided_at, void_reason, period_key, created_at',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toView(data);
}

export function reportsStats(
  rows: ContributionView[],
  cycleStart: string,
  cycleEnd: string,
  chapterCents: Cents,
): ReportsStats {
  const mine = rows.filter((row) => row.voidedAt === null);
  const cyclePaid = mine.filter(
    (row) =>
      row.status === 'PAID' &&
      row.paidAt &&
      row.paidAt.slice(0, 10) >= cycleStart &&
      row.paidAt.slice(0, 10) <= cycleEnd,
  );
  const outstanding = mine.filter((row) => row.status === 'PENDING');
  const cycleTotal = sumCents(cyclePaid.map((row) => BigInt(row.amountCents)));
  const allTime = sumCents(mine.filter((row) => row.status === 'PAID').map((row) => BigInt(row.amountCents)));
  const due = sumCents(outstanding.map((row) => BigInt(row.amountCents)));
  const next = outstanding[0];
  return {
    cycleLabel: formatKES(cycleTotal),
    cycleSub: 'This cycle',
    allTimeLabel: formatKES(allTime),
    outstandingLabel: formatKES(due),
    outstandingSub: next?.dueDate ? `${next.description} due ${next.dueDate}` : 'Nothing outstanding',
    outstandingWarn: due > BigInt(0),
    chapterCycleLabel: formatKES(chapterCents),
  };
}

export async function loadChapterMonthBars(): Promise<MonthBar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chapter_monthly_contributions')
    .select('month, total_cents')
    .order('month', { ascending: true })
    .limit(6);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    month: row.month ?? '',
    shillings: Number(BigInt(String(row.total_cents ?? 0)) / BigInt(100)),
  }));
}

export async function loadStatementArchive(actor: Actor): Promise<StatementArchiveItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('statements')
    .select('id, reference, format, generated_at, period_start, period_end')
    .eq('profile_id', actor.id)
    .order('generated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    format: row.format === 'CSV' ? 'CSV' : 'PDF',
    generatedAt: row.generated_at,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  }));
}

export async function listChapterMembers(actor: Actor): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('chapter_id', actor.chapterId)
    .eq('active', true)
    .order('full_name');
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.full_name }));
}
