import { describe, expect, it } from 'vitest';
import { suggestPairings } from '@/server/services/suggest-pairings';

const members = [
  { id: 'a', name: 'Asha' },
  { id: 'b', name: 'Ben' },
  { id: 'c', name: 'Cleo' },
  { id: 'd', name: 'Dan' },
];

describe('suggestPairings', () => {
  it('is deterministic and pairs never-paired members without repeats', () => {
    const first = suggestPairings(members, []);
    const second = suggestPairings([...members].reverse(), []);
    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(first.every((group) => group.kind === 'pair')).toBe(true);
    expect(first.every((group) => group.cyclesSince === null)).toBe(true);
    const ids = first.flatMap((group) => group.memberIds).sort();
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
  });

  it('avoids a recent pair when another partner is available', () => {
    const result = suggestPairings(members, [{ a: 'a', b: 'b', cyclesAgo: 1 }]);
    const withA = result.find((group) => group.memberIds.includes('a'));
    expect(withA?.memberIds.includes('b')).toBe(false);
  });

  it('forms one group of three when the roster is odd', () => {
    const five = [...members, { id: 'e', name: 'Eve' }];
    const result = suggestPairings(five, []);
    const triples = result.filter((group) => group.kind === 'triple');
    const pairs = result.filter((group) => group.kind === 'pair');
    expect(triples).toHaveLength(1);
    expect(triples[0]?.memberIds).toHaveLength(3);
    expect(pairs).toHaveLength(1);
    expect(result.flatMap((group) => group.memberIds).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('returns a single triple for three members', () => {
    const result = suggestPairings(members.slice(0, 3), []);
    expect(result).toEqual([
      { memberIds: ['a', 'b', 'c'], kind: 'triple', cyclesSince: null },
    ]);
  });
});
