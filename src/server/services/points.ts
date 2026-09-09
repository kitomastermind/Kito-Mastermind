import { formatCompactKES } from '@/server/services/money';
import { responseGrade } from '@/server/services/dashboard-stats';

export type PointsCategory =
  | 'PRODUCTION'
  | 'REFERRALS'
  | 'ATTENDANCE'
  | 'RESPONSE_TIME'
  | 'CONTRIBUTIONS';

export type PointsDraft = {
  profileId: string;
  cycleId: string;
  category: PointsCategory;
  points: number;
  reason: string;
  sourceType: string;
  sourceId: string;
};

export type RecalcInput = {
  profileId: string;
  cycleId: string;
  joinedAt: string;
  sessions: { id: string; heldAt: string; present: boolean; late: boolean }[];
  grantsGiven: { id: string; firstTouched: boolean }[];
  deals: { id: string; saleVolumeCents: bigint; creditShare: number; verified: boolean }[];
  touchedCount: number;
  medianMinutes: number | null;
  contributions: { id: string; paid: boolean; onTime: boolean }[];
  caps: Record<PointsCategory, number>;
};

function applyCap(entries: PointsDraft[], cap: number): PointsDraft[] {
  let used = 0;
  return entries.map((entry) => {
    const remaining = Math.max(0, cap - used);
    const points = Math.min(entry.points, remaining);
    used += points;
    return { ...entry, points };
  }).filter((entry) => entry.points > 0 || entries.length === 1);
}

export function recalculateUserPoints(input: RecalcInput): PointsDraft[] {
  const joined = new Date(input.joinedAt).getTime();
  const attendance = input.sessions
    .filter((session) => session.present && new Date(session.heldAt).getTime() >= joined)
    .map((session) => {
      const points = session.late ? 15 : 20;
      return {
        profileId: input.profileId,
        cycleId: input.cycleId,
        category: 'ATTENDANCE' as const,
        points,
        reason: session.late
          ? 'Session attended, marked late (−5)'
          : 'Session attended',
        sourceType: 'SESSION',
        sourceId: session.id,
      };
    });
  const referrals = input.grantsGiven
    .filter((grant) => grant.firstTouched)
    .map((grant) => ({
      profileId: input.profileId,
      cycleId: input.cycleId,
      category: 'REFERRALS' as const,
      points: 30,
      reason: 'Grant you gave was first-touched by the grantee',
      sourceType: 'GRANT',
      sourceId: grant.id,
    }));
  const production = input.deals
    .filter((deal) => deal.verified)
    .map((deal) => {
      const credited = (deal.saleVolumeCents * BigInt(deal.creditShare)) / BigInt(100);
      const shillings = credited / BigInt(100);
      const points = Number(shillings / BigInt(500_000));
      return {
        profileId: input.profileId,
        cycleId: input.cycleId,
        category: 'PRODUCTION' as const,
        points,
        reason: `Closed deal, ${formatCompactKES(credited)}`,
        sourceType: 'CLOSED_BUSINESS',
        sourceId: deal.id,
      };
    })
    .filter((row) => row.points > 0);
  const response: PointsDraft[] = [];
  if (input.touchedCount < 3 || input.medianMinutes === null) {
    response.push({
      profileId: input.profileId,
      cycleId: input.cycleId,
      category: 'RESPONSE_TIME',
      points: 0,
      reason: 'Not enough leads yet',
      sourceType: 'RESPONSE',
      sourceId: input.cycleId,
    });
  } else {
    const grade = responseGrade(input.medianMinutes);
    const points = { A: 90, B: 65, C: 40, D: 15, F: 0 }[grade];
    response.push({
      profileId: input.profileId,
      cycleId: input.cycleId,
      category: 'RESPONSE_TIME',
      points,
      reason: `Median first touch grade ${grade}`,
      sourceType: 'RESPONSE',
      sourceId: input.cycleId,
    });
  }
  const contributions = input.contributions.map((row) => ({
    profileId: input.profileId,
    cycleId: input.cycleId,
    category: 'CONTRIBUTIONS' as const,
    points: !row.paid ? 0 : row.onTime ? 10 : 5,
    reason: !row.paid ? 'Unpaid contribution' : row.onTime ? 'On-time payment' : 'Late payment',
    sourceType: 'CONTRIBUTION',
    sourceId: row.id,
  }));
  return [
    ...applyCap(attendance, input.caps.ATTENDANCE),
    ...applyCap(referrals, input.caps.REFERRALS),
    ...applyCap(production, input.caps.PRODUCTION),
    ...applyCap(response, input.caps.RESPONSE_TIME),
    ...applyCap(contributions.filter((row) => row.points > 0), input.caps.CONTRIBUTIONS),
  ];
}
