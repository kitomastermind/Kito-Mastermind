import { describe, expect, it } from 'vitest';
import { recalculateUserPoints, type RecalcInput } from '@/server/services/points';

const caps = {
  ATTENDANCE: 120,
  REFERRALS: 150,
  PRODUCTION: 180,
  RESPONSE_TIME: 90,
  CONTRIBUTIONS: 60,
};

function base(overrides: Partial<RecalcInput> = {}): RecalcInput {
  return {
    profileId: 'user-1',
    cycleId: 'cycle-1',
    joinedAt: '2026-01-01T00:00:00Z',
    sessions: [],
    grantsGiven: [],
    deals: [],
    touchedCount: 0,
    medianMinutes: null,
    contributions: [],
    caps,
    ...overrides,
  };
}

describe('recalculateUserPoints', () => {
  it('caps attendance after six on-time sessions', () => {
    const sessions = Array.from({ length: 8 }, (_, i) => ({
      id: `s${i}`,
      heldAt: `2026-0${i + 1}-01T07:00:00Z`,
      present: true,
      late: false,
    }));
    const entries = recalculateUserPoints(base({ sessions }));
    const total = entries.filter((row) => row.category === 'ATTENDANCE').reduce((sum, row) => sum + row.points, 0);
    expect(total).toBe(120);
  });

  it('applies the late-session penalty', () => {
    const entries = recalculateUserPoints(
      base({
        sessions: [{ id: 's1', heldAt: '2026-04-01T07:00:00Z', present: true, late: true }],
      }),
    );
    expect(entries.find((row) => row.category === 'ATTENDANCE')?.points).toBe(15);
  });

  it('ignores unverified deals', () => {
    const entries = recalculateUserPoints(
      base({
        deals: [
          { id: 'd1', saleVolumeCents: BigInt(80_000_000_00), creditShare: 100, verified: false },
        ],
      }),
    );
    expect(entries.filter((row) => row.category === 'PRODUCTION')).toHaveLength(0);
  });

  it('awards production on verified credited volume', () => {
    const entries = recalculateUserPoints(
      base({
        deals: [
          { id: 'd1', saleVolumeCents: BigInt(80_000_000_00), creditShare: 100, verified: true },
        ],
      }),
    );
    expect(entries.find((row) => row.category === 'PRODUCTION')?.points).toBe(160);
  });

  it('yields no response-time points below three touched leads', () => {
    const entries = recalculateUserPoints(base({ touchedCount: 2, medianMinutes: 18 }));
    const row = entries.find((item) => item.category === 'RESPONSE_TIME');
    expect(row?.points).toBe(0);
    expect(row?.reason).toBe('Not enough leads yet');
  });

  it('skips sessions before a mid-cycle join', () => {
    const entries = recalculateUserPoints(
      base({
        joinedAt: '2026-06-01T00:00:00Z',
        sessions: [
          { id: 's1', heldAt: '2026-04-01T07:00:00Z', present: true, late: false },
          { id: 's2', heldAt: '2026-07-01T07:00:00Z', present: true, late: false },
        ],
      }),
    );
    expect(entries.filter((row) => row.category === 'ATTENDANCE')).toHaveLength(1);
    expect(entries.find((row) => row.category === 'ATTENDANCE')?.sourceId).toBe('s2');
  });
});
