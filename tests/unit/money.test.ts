import { describe, expect, it } from 'vitest';
import {
  formatCompactKES,
  formatKES,
  fromShillings,
  parseBudgetInput,
  sumCents,
} from '@/server/services/money';

describe('money', () => {
  it('converts shillings to cents with rounding', () => {
    expect(fromShillings(5000)).toBe(BigInt(500_000));
    expect(fromShillings('5000.5')).toBe(BigInt(500_050));
    expect(fromShillings(0.1) + fromShillings(0.2)).toBe(BigInt(30));
  });

  it('formats whole and fractional amounts', () => {
    expect(formatKES(BigInt(500_000))).toBe('KES 5,000');
    expect(formatKES(BigInt(500_050))).toBe('KES 5,000.50');
    expect(formatKES(BigInt(-2500))).toBe('-KES 25');
  });

  it('formats compact values above one million shillings', () => {
    expect(formatCompactKES(BigInt(4_260_000_000))).toBe('42.6M KES');
    expect(formatCompactKES(BigInt(50_000))).toBe('KES 500');
  });

  it('parses budget input including millions suffix', () => {
    expect(parseBudgetInput('28,000,000')).toBe(BigInt(2_800_000_000));
    expect(parseBudgetInput('28m')).toBe(BigInt(2_800_000_000));
    expect(parseBudgetInput('28M')).toBe(BigInt(2_800_000_000));
    expect(parseBudgetInput('28.5m')).toBe(BigInt(2_850_000_000));
    expect(parseBudgetInput('not-a-number')).toBeNull();
  });

  it('parses values above Number.MAX_SAFE_INTEGER as bigint cents', () => {
    const raw = '9007199254740993';
    const cents = parseBudgetInput(raw);
    expect(cents).toBe(BigInt('900719925474099300'));
    expect(cents! > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('sums cents without using number', () => {
    expect(sumCents([BigInt(10), BigInt(20), BigInt(30)])).toBe(BigInt(60));
  });
});
