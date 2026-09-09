import { describe, expect, it } from 'vitest';
import {
  creditedVolumeCents,
  cycleWeekNumber,
  fasterThanPercent,
  pipelineFromStatuses,
  rankInChapter,
  responseCard,
  responseGrade,
  sumCategoryPoints,
  totalPoints,
} from '@/server/services/dashboard-stats';

describe('dashboard stats', () => {
  it('computes cycle week from the start date', () => {
    expect(cycleWeekNumber(new Date('2026-07-01T00:00:00Z'), new Date('2026-07-01T00:00:00Z'))).toBe(1);
    expect(cycleWeekNumber(new Date('2026-07-01T00:00:00Z'), new Date('2026-09-09T00:00:00Z'))).toBe(11);
  });

  it('ranks a member in the chapter', () => {
    const rank = rankInChapter('g', [
      { profileId: 'a', points: 100 },
      { profileId: 'g', points: 482 },
      { profileId: 'b', points: 200 },
    ]);
    expect(rank).toEqual({ rank: 1, of: 3 });
  });

  it('maps response-time grades and the three-lead threshold', () => {
    expect(responseGrade(18)).toBe('A');
    expect(responseGrade(90)).toBe('B');
    expect(responseCard(2, 18)).toEqual({ kind: 'insufficient' });
    expect(responseCard(3, 18)).toEqual({ kind: 'grade', grade: 'A', minutes: 18 });
  });

  it('reports how many chapter medians are slower', () => {
    expect(fasterThanPercent(18, [18, 40, 90, 200, 10])).toBe(60);
  });

  it('fills pipeline stages up to the furthest status and skips lost', () => {
    const row = pipelineFromStatuses(['NEW', 'QUALIFIED', 'LOST']);
    expect(row.activeCount).toBe(2);
    expect(row.leadingIndex).toBe(2);
    expect(row.stages).toEqual([true, true, true, false, false]);
  });

  it('sums points and credited volume in cents', () => {
    expect(totalPoints([{ points: 100 }, { points: 90 }])).toBe(190);
    expect(
      sumCategoryPoints([
        { category: 'PRODUCTION', points: 160 },
        { category: 'REFERRALS', points: 90 },
      ]).PRODUCTION,
    ).toBe(160);
    expect(
      creditedVolumeCents([{ saleVolumeCents: BigInt(4_260_000_000), creditShare: 100 }]),
    ).toBe(BigInt(4_260_000_000));
  });
});
