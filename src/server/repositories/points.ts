import { formatNairobiDate } from '@/lib/format';
import type { Actor } from '@/server/policy';
import type { PointsCategory } from '@/server/services/points';
import { POINTS_SEGMENT_ORDER, sumCategoryPoints, totalPoints } from '@/server/services/dashboard-stats';
import { createClient } from '@/server/supabase/server';

export type PointsLedgerEntry = {
  id: string;
  category: PointsCategory;
  points: number;
  reason: string;
  awardedAt: string;
};

export type PointsCategoryBlock = {
  category: PointsCategory;
  label: string;
  points: number;
  cap: number;
  entries: PointsLedgerEntry[];
  zeroNote: string | null;
};

export type PointsPageModel = {
  total: number;
  cap: number;
  categories: PointsCategoryBlock[];
};

const ZERO_NOTE: Record<PointsCategory, string> = {
  ATTENDANCE: 'No sessions attended yet this cycle.',
  REFERRALS: 'Referral points appear after a grant you gave is first-touched.',
  PRODUCTION: 'Production points appear after a Chapter Lead verifies a deal.',
  RESPONSE_TIME: 'Not enough leads yet',
  CONTRIBUTIONS: 'No paid contributions in this cycle yet.',
};

export async function loadPointsPage(actor: Actor): Promise<PointsPageModel> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: cycle } = await supabase
    .from('cycles')
    .select('id, points_cap')
    .eq('chapter_id', actor.chapterId)
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();
  const cap = cycle?.points_cap ?? 600;
  if (!cycle) {
    return {
      total: 0,
      cap,
      categories: POINTS_SEGMENT_ORDER.map((item) => ({
        category: item.category,
        label: item.label,
        points: 0,
        cap: 0,
        entries: [],
        zeroNote: ZERO_NOTE[item.category],
      })),
    };
  }
  const { data: entries, error } = await supabase
    .from('points_entries')
    .select('id, category, points, reason, awarded_at')
    .eq('profile_id', actor.id)
    .eq('cycle_id', cycle.id)
    .order('awarded_at', { ascending: false });
  if (error) throw error;
  const { data: config } = await supabase.from('points_config').select('category, cap, chapter_id');
  const caps: Record<PointsCategory, number> = {
    ATTENDANCE: 120,
    REFERRALS: 150,
    PRODUCTION: 180,
    RESPONSE_TIME: 90,
    CONTRIBUTIONS: 60,
  };
  for (const row of config ?? []) {
    if (row.chapter_id === null && row.category in caps) caps[row.category] = row.cap;
  }
  for (const row of config ?? []) {
    if (row.chapter_id === actor.chapterId && row.category in caps) caps[row.category] = row.cap;
  }
  const mapped: PointsLedgerEntry[] = (entries ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    points: row.points,
    reason: row.reason,
    awardedAt: formatNairobiDate(row.awarded_at),
  }));
  const byCat = sumCategoryPoints(mapped);
  return {
    total: totalPoints(mapped),
    cap,
    categories: POINTS_SEGMENT_ORDER.map((item) => {
      const catEntries = mapped.filter((row) => row.category === item.category);
      const points = byCat[item.category];
      const responseZero = catEntries.find((row) => row.reason === 'Not enough leads yet');
      return {
        category: item.category,
        label: item.label,
        points,
        cap: caps[item.category],
        entries: catEntries,
        zeroNote: points === 0 ? (responseZero?.reason ?? ZERO_NOTE[item.category]) : null,
      };
    }),
  };
}
