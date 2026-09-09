import { formatInTimeZone } from 'date-fns-tz';
import { NAIROBI_TZ } from '@/lib/format';
import { supabaseAdmin } from '@/server/admin/client';
import {
  recalculateUserPoints,
  type PointsCategory,
  type RecalcInput,
} from '@/server/services/points';

const DEFAULT_CAPS: Record<PointsCategory, number> = {
  ATTENDANCE: 120,
  REFERRALS: 150,
  PRODUCTION: 180,
  RESPONSE_TIME: 90,
  CONTRIBUTIONS: 60,
};

function entryKey(category: string, sourceType: string, sourceId: string | null): string {
  return `${category}|${sourceType}|${sourceId ?? ''}`;
}

async function loadInput(profileId: string, cycleId: string, chapterId: string): Promise<RecalcInput> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('joined_at')
    .eq('id', profileId)
    .single();
  const { data: cycle } = await supabaseAdmin
    .from('cycles')
    .select('start_date, end_date')
    .eq('id', cycleId)
    .single();
  const { data: sessions } = await supabaseAdmin
    .from('mastermind_sessions')
    .select('id, held_at')
    .eq('chapter_id', chapterId);
  const { data: attendance } = await supabaseAdmin
    .from('session_attendance')
    .select('session_id, present, late')
    .eq('profile_id', profileId);
  const { data: grants } = await supabaseAdmin
    .from('lead_contact_grants')
    .select('id, lead_id, revoked_at, last_viewed_at')
    .eq('grantor_id', profileId);
  const leadIds = [...new Set((grants ?? []).map((row) => row.lead_id))];
  const { data: touches } = leadIds.length
    ? await supabaseAdmin
        .from('lead_activity')
        .select('lead_id')
        .eq('kind', 'FIRST_TOUCH')
        .in('lead_id', leadIds)
    : { data: [] as { lead_id: string }[] };
  const { data: deals } = await supabaseAdmin
    .from('closed_business')
    .select('id, sale_volume, verified_at, closed_at')
    .eq('chapter_id', chapterId);
  const dealIds = (deals ?? []).map((row) => row.id);
  const { data: parts } = dealIds.length
    ? await supabaseAdmin
        .from('closed_business_participants')
        .select('closed_business_id, profile_id, credit_share')
        .eq('profile_id', profileId)
        .in('closed_business_id', dealIds)
    : { data: [] as { closed_business_id: string; profile_id: string; credit_share: number }[] };
  const { data: response } = await supabaseAdmin
    .from('member_response_times')
    .select('touched_count, median_minutes')
    .eq('profile_id', profileId)
    .maybeSingle();
  const { data: contributions } = await supabaseAdmin
    .from('contributions')
    .select('id, status, due_date, paid_at, voided_at')
    .eq('profile_id', profileId)
    .is('voided_at', null);
  const { data: config } = await supabaseAdmin
    .from('points_config')
    .select('category, cap, chapter_id');
  const caps = { ...DEFAULT_CAPS };
  for (const row of config ?? []) {
    if (row.chapter_id === null && row.category in caps) caps[row.category] = row.cap;
  }
  for (const row of config ?? []) {
    if (row.chapter_id === chapterId && row.category in caps) caps[row.category] = row.cap;
  }
  const start = cycle?.start_date ?? '0000-01-01';
  const end = cycle?.end_date ?? '9999-12-31';
  const inCycle = (iso: string) => iso.slice(0, 10) >= start && iso.slice(0, 10) <= end;
  return {
    profileId,
    cycleId,
    joinedAt: profile?.joined_at ?? '2026-01-01',
    sessions: (sessions ?? []).filter((session) => inCycle(session.held_at)).map((session) => {
      const mine = attendance?.find((row) => row.session_id === session.id);
      return {
        id: session.id,
        heldAt: session.held_at,
        present: Boolean(mine?.present),
        late: Boolean(mine?.late),
      };
    }),
    grantsGiven: (grants ?? [])
      .filter((row) => !row.revoked_at)
      .map((row) => {
        return {
          id: row.id,
          firstTouched: Boolean(
            row.last_viewed_at || touches?.some((item) => item.lead_id === row.lead_id),
          ),
        };
      }),
    deals: (deals ?? []).flatMap((deal) => {
      if (!inCycle(deal.closed_at)) return [];
      const share = parts?.find((row) => row.closed_business_id === deal.id);
      if (!share) return [];
      return [
        {
          id: deal.id,
          saleVolumeCents: BigInt(String(deal.sale_volume)),
          creditShare: share.credit_share,
          verified: Boolean(deal.verified_at),
        },
      ];
    }),
    touchedCount: response?.touched_count ?? 0,
    medianMinutes: response?.median_minutes ?? null,
    contributions: (contributions ?? []).map((row) => ({
      id: row.id,
      paid: row.status === 'PAID',
      onTime: Boolean(row.paid_at && row.due_date && row.paid_at.slice(0, 10) <= row.due_date),
    })),
    caps,
  };
}

export async function upsertUserPoints(profileId: string, cycleId: string, chapterId: string): Promise<number> {
  const drafts = recalculateUserPoints(await loadInput(profileId, cycleId, chapterId));
  if (drafts.length > 0) {
    const { error } = await supabaseAdmin.from('points_entries').upsert(
      drafts.map((row) => ({
        profile_id: row.profileId,
        cycle_id: row.cycleId,
        category: row.category,
        points: row.points,
        reason: row.reason,
        source_type: row.sourceType,
        source_id: row.sourceId,
      })),
      { onConflict: 'profile_id,cycle_id,category,source_type,source_id' },
    );
    if (error) throw error;
  }
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('points_entries')
    .select('id, category, source_type, source_id')
    .eq('profile_id', profileId)
    .eq('cycle_id', cycleId);
  if (existingError) throw existingError;
  const keep = new Set(drafts.map((row) => entryKey(row.category, row.sourceType, row.sourceId)));
  const stale = (existing ?? []).filter(
    (row) => !keep.has(entryKey(row.category, row.source_type, row.source_id)),
  );
  if (stale.length > 0) {
    const { error } = await supabaseAdmin
      .from('points_entries')
      .delete()
      .in(
        'id',
        stale.map((row) => row.id),
      );
    if (error) throw error;
  }
  return drafts.length;
}

async function currentCycleForChapter(chapterId: string): Promise<{ id: string; chapterId: string } | null> {
  const today = formatInTimeZone(new Date(), NAIROBI_TZ, 'yyyy-MM-dd');
  const { data } = await supabaseAdmin
    .from('cycles')
    .select('id, chapter_id')
    .eq('chapter_id', chapterId)
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();
  return data ? { id: data.id, chapterId: data.chapter_id } : null;
}

export async function recomputeCurrentCycleForProfile(profileId: string): Promise<void> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, chapter_id')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile) return;
  const cycle = await currentCycleForChapter(profile.chapter_id);
  if (!cycle) return;
  await upsertUserPoints(profile.id, cycle.id, profile.chapter_id);
}

export async function recomputeAfterAttendance(profileId: string): Promise<void> {
  await recomputeCurrentCycleForProfile(profileId);
}

export async function recomputeGrantorsForLead(leadId: string): Promise<void> {
  const { data: grants } = await supabaseAdmin
    .from('lead_contact_grants')
    .select('grantor_id')
    .eq('lead_id', leadId)
    .is('revoked_at', null);
  const { data: touch } = await supabaseAdmin
    .from('lead_activity')
    .select('actor_id')
    .eq('lead_id', leadId)
    .eq('kind', 'FIRST_TOUCH')
    .limit(1)
    .maybeSingle();
  const ids = new Set((grants ?? []).map((row) => row.grantor_id));
  if (touch?.actor_id) ids.add(touch.actor_id);
  for (const id of ids) {
    await recomputeCurrentCycleForProfile(id);
  }
}

export async function recomputeParticipantsForDeal(dealId: string): Promise<void> {
  const { data: parts } = await supabaseAdmin
    .from('closed_business_participants')
    .select('profile_id')
    .eq('closed_business_id', dealId);
  for (const row of parts ?? []) {
    await recomputeCurrentCycleForProfile(row.profile_id);
  }
}

export async function recalculateAllCurrentCycle(): Promise<{ members: number }> {
  const today = formatInTimeZone(new Date(), NAIROBI_TZ, 'yyyy-MM-dd');
  const { data: cycles } = await supabaseAdmin
    .from('cycles')
    .select('id, chapter_id')
    .lte('start_date', today)
    .gte('end_date', today);
  let members = 0;
  for (const cycle of cycles ?? []) {
    const { data: people } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('chapter_id', cycle.chapter_id)
      .eq('active', true);
    for (const person of people ?? []) {
      await upsertUserPoints(person.id, cycle.id, cycle.chapter_id);
      members += 1;
    }
  }
  return { members };
}
