export type PointsCategory =
  | 'PRODUCTION'
  | 'REFERRALS'
  | 'ATTENDANCE'
  | 'RESPONSE_TIME'
  | 'CONTRIBUTIONS';

export const POINTS_SEGMENT_ORDER: readonly {
  category: PointsCategory;
  color: string;
  label: string;
}[] = [
  { category: 'PRODUCTION', color: 'primary', label: 'Production' },
  { category: 'REFERRALS', color: 'secondary', label: 'Referrals' },
  { category: 'ATTENDANCE', color: 'primary-soft', label: 'Attendance' },
  { category: 'RESPONSE_TIME', color: 'chart-4', label: 'Response Time' },
  { category: 'CONTRIBUTIONS', color: 'line', label: 'Contributions' },
];

export type ResponseGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export function cycleWeekNumber(start: Date, now: Date): number {
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.floor((nowUtc - startUtc) / 86_400_000);
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function sumCategoryPoints(
  entries: ReadonlyArray<{ category: string; points: number }>,
): Record<PointsCategory, number> {
  const totals: Record<PointsCategory, number> = {
    PRODUCTION: 0,
    REFERRALS: 0,
    ATTENDANCE: 0,
    RESPONSE_TIME: 0,
    CONTRIBUTIONS: 0,
  };
  for (const entry of entries) {
    if (entry.category in totals) {
      totals[entry.category as PointsCategory] += entry.points;
    }
  }
  return totals;
}

export function totalPoints(entries: ReadonlyArray<{ points: number }>): number {
  return entries.reduce((sum, entry) => sum + entry.points, 0);
}

export function rankInChapter(
  profileId: string,
  totals: ReadonlyArray<{ profileId: string; points: number }>,
): { rank: number; of: number } {
  const sorted = [...totals].sort((a, b) => b.points - a.points || a.profileId.localeCompare(b.profileId));
  const index = sorted.findIndex((row) => row.profileId === profileId);
  return { rank: index < 0 ? sorted.length : index + 1, of: totals.length };
}

export function responseGrade(medianMinutes: number): ResponseGrade {
  if (medianMinutes <= 30) return 'A';
  if (medianMinutes <= 120) return 'B';
  if (medianMinutes <= 480) return 'C';
  if (medianMinutes <= 1440) return 'D';
  return 'F';
}

export function responseCard(
  touchedCount: number,
  medianMinutes: number | null,
):
  | { kind: 'insufficient' }
  | { kind: 'grade'; grade: ResponseGrade; minutes: number } {
  if (touchedCount < 3 || medianMinutes === null) {
    return { kind: 'insufficient' };
  }
  return {
    kind: 'grade',
    grade: responseGrade(medianMinutes),
    minutes: Math.round(medianMinutes),
  };
}

export function fasterThanPercent(mine: number, chapter: readonly number[]): number | null {
  if (chapter.length === 0) return null;
  const slower = chapter.filter((value) => value > mine).length;
  return Math.round((slower / chapter.length) * 100);
}

const PIPELINE_STAGES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'UNDER_CONTRACT',
  'CLOSED',
] as const;

export function pipelineFromStatuses(statuses: readonly string[]): {
  stages: boolean[];
  leadingIndex: number;
  activeCount: number;
} {
  let furthest = -1;
  let activeCount = 0;
  for (const status of statuses) {
    if (status !== 'CLOSED' && status !== 'LOST') activeCount += 1;
    const index = PIPELINE_STAGES.indexOf(status as (typeof PIPELINE_STAGES)[number]);
    if (index > furthest) furthest = index;
  }
  const stages = PIPELINE_STAGES.map((_, index) => furthest >= index);
  return { stages, leadingIndex: furthest, activeCount };
}

export function creditedVolumeCents(
  deals: ReadonlyArray<{ saleVolumeCents: bigint; creditShare: number }>,
): bigint {
  return deals.reduce((sum, deal) => {
    return sum + (deal.saleVolumeCents * BigInt(deal.creditShare)) / BigInt(100);
  }, BigInt(0));
}
