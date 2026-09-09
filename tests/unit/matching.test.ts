import { describe, expect, it } from 'vitest';
import {
  isMatchable,
  scoreArea,
  scoreMatch,
  type MatchableLead,
} from '@/server/services/matching';

const M = (millions: number): bigint => BigInt(millions) * BigInt(1_000_000) * BigInt(100);

function lead(overrides: Partial<MatchableLead> & Pick<MatchableLead, 'id' | 'ownerId' | 'leadType'>): MatchableLead {
  return {
    chapterId: 'nbo',
    status: 'NEW',
    areaId: 'lav',
    areaParentId: 'westlands',
    areaCity: 'Nairobi',
    areaFreeText: 'Lavington',
    budgetMinCents: M(28),
    budgetMaxCents: M(32),
    propertyType: 'TOWNHOUSE',
    timeline: 'ONE_TO_THREE_MONTHS',
    ...overrides,
  };
}

const buyer = lead({ id: 'a', ownerId: 'grace', leadType: 'BUYER' });
const seller = lead({
  id: 'b',
  ownerId: 'amara',
  leadType: 'SELLER',
  timeline: 'IMMEDIATE',
});

describe('matching', () => {
  it('scores a strong Lavington townhouse pair at 95', () => {
    const result = scoreMatch(buyer, seller);
    expect(result?.score).toBe(95);
  });

  it('scores a partial apartment/budget miss at 61', () => {
    const result = scoreMatch(buyer, {
      ...seller,
      budgetMinCents: M(22),
      budgetMaxCents: M(27),
      propertyType: 'APARTMENT',
    });
    expect(result?.score).toBe(61);
  });

  it('rejects two buyers', () => {
    expect(isMatchable(buyer, { ...buyer, id: 'c', ownerId: 'amara' })).toBe(false);
    expect(scoreMatch(buyer, { ...buyer, id: 'c', ownerId: 'amara' })).toBeNull();
  });

  it('rejects the same owner', () => {
    expect(isMatchable(buyer, { ...seller, ownerId: buyer.ownerId })).toBe(false);
  });

  it('rejects different chapters', () => {
    expect(isMatchable(buyer, { ...seller, chapterId: 'msa' })).toBe(false);
  });

  it('scores land against townhouse at 80 when other facets match', () => {
    const result = scoreMatch(
      { ...buyer, propertyType: 'LAND', timeline: 'IMMEDIATE' },
      { ...seller, timeline: 'IMMEDIATE' },
    );
    expect(result?.score).toBe(80);
  });

  it('caps unresolved free-text area at 0.8 and the total at 92', () => {
    const a = {
      ...buyer,
      areaId: null,
      areaParentId: null,
      areaFreeText: 'Lavington',
    };
    const b = {
      ...seller,
      areaId: null,
      areaParentId: null,
      areaFreeText: 'lavington ',
    };
    expect(scoreArea(a, b)).toBeLessThanOrEqual(0.8);
    const result = scoreMatch(a, b);
    expect(result?.score).toBeLessThanOrEqual(92);
  });

  it('scores a missing budget as 0.4, totalling 82', () => {
    const result = scoreMatch(
      {
        ...buyer,
        budgetMinCents: null,
        budgetMaxCents: null,
        timeline: 'IMMEDIATE',
      },
      { ...seller, timeline: 'IMMEDIATE' },
    );
    expect(result?.score).toBe(82);
  });

  it('rejects closed or lost leads', () => {
    expect(isMatchable({ ...buyer, status: 'CLOSED' }, seller)).toBe(false);
    expect(isMatchable(buyer, { ...seller, status: 'LOST' })).toBe(false);
  });
});
