import { formatInTimeZone } from 'date-fns-tz';
import { firstName, greetingForHour, NAIROBI_TZ } from '@/lib/format';
import { formatCompactKES } from '@/server/services/money';
import type { Actor } from '@/server/policy';
import {
  creditedVolumeCents,
  cycleWeekNumber,
  fasterThanPercent,
  POINTS_SEGMENT_ORDER,
  rankInChapter,
  responseCard,
  sumCategoryPoints,
  totalPoints,
} from '@/server/services/dashboard-stats';
import { loadActions, loadMatch, loadPipeline, loadTopic } from '@/server/repositories/dashboard-panels';
import { listDealsForActor } from '@/server/repositories/deals';
import { canVerifyClosedBusiness } from '@/server/policy';
import { createClient } from '@/server/supabase/server';

import type { DashboardMatch, DashboardModel } from '@/server/dto/dashboard';

export type { DashboardMatch, DashboardModel };

export async function loadDashboard(actor: Actor, now = new Date()): Promise<DashboardModel> {
  const supabase = await createClient();
  const hour = Number(formatInTimeZone(now, NAIROBI_TZ, 'H'));
  const today = formatInTimeZone(now, NAIROBI_TZ, 'yyyy-MM-dd');
  const monthStart = formatInTimeZone(now, NAIROBI_TZ, 'yyyy-MM-01');

  const [{ data: cycle }, { data: chapter }, { data: nextSession }] = await Promise.all([
    supabase
      .from('cycles')
      .select('id, name, start_date, end_date, points_cap')
      .eq('chapter_id', actor.chapterId)
      .lte('start_date', today)
      .gte('end_date', today)
      .maybeSingle(),
    supabase.from('chapters').select('name').eq('id', actor.chapterId).maybeSingle(),
    supabase
      .from('mastermind_sessions')
      .select('held_at')
      .eq('chapter_id', actor.chapterId)
      .gt('held_at', now.toISOString())
      .order('held_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  const chapterName = chapter?.name ?? 'Chapter';

  const week = cycle
    ? cycleWeekNumber(new Date(`${cycle.start_date}T00:00:00Z`), now)
    : 1;
  const eyebrow = cycle ? `${cycle.name} · Week ${week}` : 'Your chapter';
  const nextSessionLabel = nextSession
    ? `Next mastermind: ${formatInTimeZone(nextSession.held_at, NAIROBI_TZ, 'EEEE, d MMM · HH:mm')}`
    : 'No session scheduled';

  const [
    pointsPart,
    responsePart,
    volumePart,
    referralsPart,
    actions,
    pipeline,
    match,
    topic,
    allDeals,
  ] = await Promise.all([
    loadPoints(actor, cycle?.id ?? null, cycle?.points_cap ?? 600),
    loadResponse(actor),
    loadVolume(actor, cycle?.start_date ?? null, cycle?.end_date ?? null),
    loadReferrals(actor),
    loadActions(actor),
    loadPipeline(actor),
    loadMatch(actor, chapterName),
    loadTopic(monthStart),
    listDealsForActor(actor),
  ]);
  const canVerifyDeals = canVerifyClosedBusiness(actor, actor.chapterId).allow;
  const deals = allDeals.filter((deal) => {
    if (deal.verifiedAt) return false;
    const mine = deal.participants.find((row) => row.profileId === actor.id);
    return Boolean((mine && !mine.confirmedAt) || canVerifyDeals);
  });

  return {
    actorId: actor.id,
    greeting: greetingForHour(Number.isFinite(hour) ? hour : 12),
    firstName: firstName(actor.fullName),
    eyebrow,
    nextSession: nextSessionLabel,
    ...pointsPart,
    ...responsePart,
    ...volumePart,
    ...referralsPart,
    actions,
    pipeline,
    match,
    topic,
    deals,
    canVerifyDeals,
  };
}

async function loadPoints(
  actor: Actor,
  cycleId: string | null,
  cap: number,
): Promise<Pick<DashboardModel, 'pointsValue' | 'pointsSub' | 'segments'>> {
  const empty = {
    pointsValue: null as string | null,
    pointsSub:
      'Your first cycle starts after your first session. Points appear here once attendance is marked.',
    segments: POINTS_SEGMENT_ORDER.map((item) => ({
      label: item.label,
      points: 0,
      color: item.color,
    })),
  };
  if (!cycleId) return empty;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('member_points_summary')
    .select('profile_id, category, points')
    .eq('cycle_id', cycleId);
  if (error) throw error;
  const { data: members, error: memberError } = await supabase
    .from('profiles')
    .select('id')
    .eq('chapter_id', actor.chapterId)
    .eq('active', true);
  if (memberError) throw memberError;
  const mine = (data ?? []).flatMap((row) => {
    if (!row.profile_id || !row.category || row.points === null) return [];
    return [{ profile_id: row.profile_id, category: row.category, points: row.points }];
  }).filter((row) => row.profile_id === actor.id);
  const totalsByProfile = new Map<string, number>();
  for (const member of members ?? []) {
    totalsByProfile.set(member.id, 0);
  }
  for (const row of data ?? []) {
    if (!row.profile_id || row.points === null) continue;
    totalsByProfile.set(row.profile_id, (totalsByProfile.get(row.profile_id) ?? 0) + row.points);
  }
  const chapterTotals = [...totalsByProfile.entries()].map(([profileId, points]) => ({
    profileId,
    points,
  }));
  if (mine.length === 0) return empty;
  const total = totalPoints(mine);
  const byCat = sumCategoryPoints(mine);
  const rank = rankInChapter(actor.id, chapterTotals);
  return {
    pointsValue: `${total} / ${cap}`,
    pointsSub: `Rank ${rank.rank} of ${rank.of} in chapter`,
    segments: POINTS_SEGMENT_ORDER.map((item) => ({
      label: item.label,
      points: byCat[item.category],
      color: item.color,
    })),
  };
}

async function loadResponse(
  actor: Actor,
): Promise<Pick<DashboardModel, 'responseValue' | 'responseSub'>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('member_response_times')
    .select('profile_id, touched_count, median_minutes');
  if (error) throw error;
  const mine = data?.find((row) => row.profile_id === actor.id);
  const card = responseCard(mine?.touched_count ?? 0, mine?.median_minutes ?? null);
  if (card.kind === 'insufficient') {
    return {
      responseValue: null,
      responseSub: 'Not enough leads yet',
    };
  }
  const others = (data ?? [])
    .filter((row) => row.profile_id !== actor.id && row.median_minutes !== null)
    .map((row) => Number(row.median_minutes));
  const faster = fasterThanPercent(card.minutes, others);
  return {
    responseValue: `${card.grade} · ${card.minutes} min`,
    responseSub: faster === null ? 'In your chapter' : `Faster than ${faster}% of chapter`,
  };
}

async function loadVolume(
  actor: Actor,
  start: string | null,
  end: string | null,
): Promise<Pick<DashboardModel, 'volumeValue' | 'volumeSub'>> {
  const supabase = await createClient();
  let query = supabase
    .from('closed_business')
    .select(
      'id, sale_volume, closed_at, verified_at, closed_business_participants(profile_id, credit_share, participant_role)',
    )
    .eq('chapter_id', actor.chapterId)
    .not('verified_at', 'is', null);
  if (start) query = query.gte('closed_at', start);
  if (end) query = query.lte('closed_at', end);
  const { data, error } = await query;
  if (error) throw error;
  const mine = (data ?? []).flatMap((deal) => {
    const share = deal.closed_business_participants.find((row) => row.profile_id === actor.id);
    if (!share) return [];
    return [
      {
        saleVolumeCents: BigInt(String(deal.sale_volume)),
        creditShare: share.credit_share,
        fromReferral: share.participant_role === 'REFERRER',
      },
    ];
  });
  if (mine.length === 0) {
    return {
      volumeValue: null,
      volumeSub: 'Closed volume appears here after a Chapter Lead verifies a deal.',
    };
  }
  const cents = creditedVolumeCents(mine);
  const fromReferrals = mine.filter((row) => row.fromReferral).length;
  return {
    volumeValue: formatCompactKES(cents),
    volumeSub: `${mine.length} deal${mine.length === 1 ? '' : 's'} · ${fromReferrals} from member referrals`,
  };
}

async function loadReferrals(
  actor: Actor,
): Promise<Pick<DashboardModel, 'referralsValue' | 'referralsSub'>> {
  const supabase = await createClient();
  const { data: grants, error } = await supabase
    .from('lead_contact_grants')
    .select('grantor_id, grantee_id, revoked_at');
  if (error) throw error;
  const sent = (grants ?? []).filter((row) => row.grantor_id === actor.id && row.revoked_at === null).length;
  const received = (grants ?? []).filter((row) => row.grantee_id === actor.id && row.revoked_at === null).length;
  const { data: matches, error: matchError } = await supabase
    .from('lead_matches')
    .select('id, lead_a_id, lead_b_id')
    .eq('status', 'PENDING');
  if (matchError) throw matchError;
  const { data: mine } = await supabase.from('lead_pool').select('id').eq('owner_id', actor.id);
  const mineIds = new Set((mine ?? []).map((row) => row.id));
  const pending = (matches ?? []).filter(
    (row) => mineIds.has(row.lead_a_id) || mineIds.has(row.lead_b_id),
  ).length;
  return {
    referralsValue: `${sent} / ${received}`,
    referralsSub:
      pending === 1 ? '1 pending match review' : `${pending} pending match reviews`,
  };
}

