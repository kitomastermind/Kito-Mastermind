import { formatNairobiDate } from '@/lib/format';
import type { Actor } from '@/server/policy';
import { createClient } from '@/server/supabase/server';
import type {
  AccountabilityActionView,
  AccountabilityPageModel,
  AccountabilityStats,
  ActionStatus,
  PairingView,
  PastPartnerView,
  SessionOption,
  TrendPoint,
} from '@/server/dto/accountability';
import type { PairHistory, PairingMember } from '@/server/services/suggest-pairings';

function asStatus(value: string): ActionStatus {
  if (
    value === 'NOT_STARTED' ||
    value === 'IN_PROGRESS' ||
    value === 'COMPLETED' ||
    value === 'VERIFIED' ||
    value === 'OVERDUE'
  ) {
    return value;
  }
  return 'NOT_STARTED';
}

function mapAction(
  row: {
    id: string;
    description: string;
    due_date: string;
    status: string;
    owner_id: string;
    partner_id: string | null;
    session_id: string | null;
    completed_at: string | null;
    verified_at: string | null;
    nudged_at: string | null;
    chapter_id: string;
    mastermind_sessions: { held_at: string } | { held_at: string }[] | null;
  },
  names: Map<string, string>,
): AccountabilityActionView {
  const session = Array.isArray(row.mastermind_sessions)
    ? row.mastermind_sessions[0]
    : row.mastermind_sessions;
  return {
    id: row.id,
    description: row.description,
    dueDate: row.due_date,
    status: asStatus(row.status),
    ownerId: row.owner_id,
    ownerName: names.get(row.owner_id) ?? 'Member',
    partnerId: row.partner_id,
    partnerName: row.partner_id ? (names.get(row.partner_id) ?? 'Member') : null,
    sessionHeldAt: session?.held_at ?? null,
    completedAt: row.completed_at,
    verifiedAt: row.verified_at,
    nudgedAt: row.nudged_at,
    chapterId: row.chapter_id,
  };
}

export async function loadAccountabilityPage(actor: Actor): Promise<AccountabilityPageModel> {
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from('chapters')
    .select('name')
    .eq('id', actor.chapterId)
    .maybeSingle();
  const chapterName = chapter?.name ?? 'Chapter';

  const { data: members, error: memberError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('chapter_id', actor.chapterId);
  if (memberError) throw memberError;
  const names = new Map((members ?? []).map((row) => [row.id, row.full_name]));
  const emails = new Map((members ?? []).map((row) => [row.id, row.email]));

  const { data: actions, error: actionError } = await supabase
    .from('accountability_actions')
    .select(
      'id, description, due_date, status, owner_id, partner_id, session_id, completed_at, verified_at, nudged_at, chapter_id, mastermind_sessions(held_at)',
    )
    .eq('chapter_id', actor.chapterId)
    .order('due_date', { ascending: true });
  if (actionError) throw actionError;

  const mapped = (actions ?? []).map((row) => mapAction(row, names));
  const myActions = mapped.filter((row) => row.ownerId === actor.id);
  const partnerActions = mapped.filter((row) => row.ownerId !== actor.id && row.partnerId === actor.id);

  const { data: sessions, error: sessionError } = await supabase
    .from('mastermind_sessions')
    .select('id, held_at')
    .eq('chapter_id', actor.chapterId)
    .order('held_at', { ascending: false })
    .limit(12);
  if (sessionError) throw sessionError;

  const pairing = await loadActivePairing(actor, names, emails, mapped, chapterName);
  const stats = computeStats(actor.id, mapped, members?.map((row) => row.id) ?? []);
  const trend = computeTrend(myActions);
  const pastPartners = await loadPastPartners(actor, names, mapped);

  return {
    stats,
    pairing,
    myActions,
    partnerActions,
    sessions: (sessions ?? []).map((row): SessionOption => ({ id: row.id, heldAt: row.held_at })),
    trend,
    pastPartners,
    chapterName,
    actorName: actor.fullName,
    actorId: actor.id,
  };
}

async function loadActivePairing(
  actor: Actor,
  names: Map<string, string>,
  emails: Map<string, string>,
  actions: AccountabilityActionView[],
  chapterName: string,
): Promise<PairingView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pairings')
    .select('id, profile_a, profile_b, started_at')
    .eq('chapter_id', actor.chapterId)
    .is('ended_at', null);
  if (error) throw error;
  const mine = (data ?? []).find(
    (row) => row.profile_a === actor.id || row.profile_b === actor.id,
  );
  if (!mine) return null;
  const partnerId = mine.profile_a === actor.id ? mine.profile_b : mine.profile_a;
  const together = actions.filter(
    (row) =>
      (row.ownerId === actor.id && row.partnerId === partnerId) ||
      (row.ownerId === partnerId && row.partnerId === actor.id),
  );
  const verified = together.filter((row) => row.status === 'VERIFIED').length;
  const mutualRate = together.length === 0 ? '—' : `${Math.round((verified / together.length) * 100)}%`;
  return {
    id: mine.id,
    partnerId,
    partnerName: names.get(partnerId) ?? 'Member',
    partnerEmail: emails.get(partnerId) ?? null,
    startedAt: formatNairobiDate(mine.started_at),
    chapterName,
    mutualRate,
    stepsTogether: together.filter((row) => row.status === 'VERIFIED' || row.status === 'COMPLETED').length,
  };
}

function computeStats(
  actorId: string,
  actions: AccountabilityActionView[],
  memberIds: string[],
): AccountabilityStats {
  const mine = actions.filter((row) => row.ownerId === actorId);
  const verified = mine.filter((row) => row.status === 'VERIFIED').length;
  const completionRate = mine.length === 0 ? '—' : `${Math.round((verified / mine.length) * 100)}%`;
  const completedAllTime = String(verified);
  const rates = memberIds.map((id) => {
    const rows = actions.filter((row) => row.ownerId === id);
    if (rows.length === 0) return 0;
    return rows.filter((row) => row.status === 'VERIFIED').length / rows.length;
  });
  const avg = rates.length === 0 ? 0 : rates.reduce((sum, value) => sum + value, 0) / rates.length;
  const chapterAverage = `${Math.round(avg * 100)}%`;
  const streak = currentStreak(mine);
  return { completionRate, streak, completedAllTime, chapterAverage };
}

function currentStreak(mine: AccountabilityActionView[]): string {
  const bySession = new Map<string, AccountabilityActionView[]>();
  for (const action of mine) {
    const key = action.sessionHeldAt ?? action.dueDate;
    const list = bySession.get(key) ?? [];
    list.push(action);
    bySession.set(key, list);
  }
  const keys = [...bySession.keys()].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  for (const key of keys) {
    const rows = bySession.get(key) ?? [];
    if (rows.length > 0 && rows.every((row) => row.status === 'VERIFIED')) streak += 1;
    else break;
  }
  return streak === 1 ? '1 session' : `${streak} sessions`;
}

function computeTrend(mine: AccountabilityActionView[]): TrendPoint[] {
  const bySession = new Map<string, AccountabilityActionView[]>();
  for (const action of mine) {
    const key = action.sessionHeldAt ?? action.dueDate;
    const list = bySession.get(key) ?? [];
    list.push(action);
    bySession.set(key, list);
  }
  return [...bySession.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, rows]) => ({
      label: formatNairobiDate(key, 'd MMM'),
      rate: rows.length === 0 ? 0 : Math.round((rows.filter((row) => row.status === 'VERIFIED').length / rows.length) * 100),
    }));
}

async function loadPastPartners(
  actor: Actor,
  names: Map<string, string>,
  actions: AccountabilityActionView[],
): Promise<PastPartnerView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pairings')
    .select('profile_a, profile_b, ended_at')
    .eq('chapter_id', actor.chapterId)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((row) => row.profile_a === actor.id || row.profile_b === actor.id)
    .map((row) => {
      const partnerId = row.profile_a === actor.id ? row.profile_b : row.profile_a;
      const together = actions.filter(
        (action) =>
          (action.ownerId === actor.id && action.partnerId === partnerId) ||
          (action.ownerId === partnerId && action.partnerId === actor.id),
      );
      const verified = together.filter((action) => action.status === 'VERIFIED').length;
      return {
        partnerId,
        partnerName: names.get(partnerId) ?? 'Member',
        mutualRate: together.length === 0 ? '—' : `${Math.round((verified / together.length) * 100)}%`,
        endedAt: formatNairobiDate(row.ended_at ?? new Date().toISOString()),
      };
    });
}

export async function loadPairingBoard(actor: Actor): Promise<{
  members: PairingMember[];
  history: PairHistory[];
  current: { id: string; a: string; b: string; aName: string; bName: string }[];
  requests: { id: string; name: string; reason: string | null; createdAt: string }[];
  cycleId: string | null;
}> {
  const supabase = await createClient();
  const { data: members, error: memberError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('chapter_id', actor.chapterId)
    .eq('active', true)
    .order('full_name');
  if (memberError) throw memberError;
  const names = new Map((members ?? []).map((row) => [row.id, row.full_name]));
  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, start_date')
    .eq('chapter_id', actor.chapterId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: pairings, error: pairingError } = await supabase
    .from('pairings')
    .select('id, profile_a, profile_b, started_at, ended_at, cycle_id')
    .eq('chapter_id', actor.chapterId);
  if (pairingError) throw pairingError;
  const current = (pairings ?? [])
    .filter((row) => row.ended_at === null)
    .map((row) => ({
      id: row.id,
      a: row.profile_a,
      b: row.profile_b,
      aName: names.get(row.profile_a) ?? 'Member',
      bName: names.get(row.profile_b) ?? 'Member',
    }));
  const history: PairHistory[] = (pairings ?? []).map((row) => ({
    a: row.profile_a,
    b: row.profile_b,
    cyclesAgo: row.ended_at ? 1 : 0,
  }));
  const { data: requests, error: requestError } = await supabase
    .from('pairing_requests')
    .select('id, profile_id, reason, created_at')
    .eq('chapter_id', actor.chapterId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false });
  if (requestError) throw requestError;
  return {
    members: (members ?? []).map((row) => ({ id: row.id, name: row.full_name })),
    history,
    current,
    requests: (requests ?? []).map((row) => ({
      id: row.id,
      name: names.get(row.profile_id) ?? 'Member',
      reason: row.reason,
      createdAt: formatNairobiDate(row.created_at),
    })),
    cycleId: cycle?.id ?? null,
  };
}
