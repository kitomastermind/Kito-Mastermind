export type Cents = bigint;

const HUNDRED = BigInt(100);
const MILLION_SHILLINGS = BigInt(1_000_000);
const HUNDRED_THOUSAND = BigInt(100_000);

export const fromShillings = (s: number | string): Cents =>
  BigInt(Math.round(Number(s) * 100));

export const toShillings = (c: Cents): number => Number(c) / 100;

export function formatKES(c: Cents): string {
  const negative = c < BigInt(0);
  const abs = negative ? -c : c;
  const whole = abs / HUNDRED;
  const frac = abs % HUNDRED;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const amount =
    frac === BigInt(0) ? grouped : `${grouped}.${frac.toString().padStart(2, '0')}`;
  return `${negative ? '-' : ''}KES ${amount}`;
}

export function formatCompactKES(c: Cents): string {
  const negative = c < BigInt(0);
  const abs = negative ? -c : c;
  const shillings = abs / HUNDRED;
  if (shillings >= MILLION_SHILLINGS) {
    const millions = shillings / MILLION_SHILLINGS;
    const tenth = (shillings % MILLION_SHILLINGS) / HUNDRED_THOUSAND;
    return `${negative ? '-' : ''}${millions.toString()}.${tenth.toString()}M KES`;
  }
  return formatKES(c);
}

export function parseBudgetInput(raw: string): Cents | null {
  const trimmed = raw.trim().replace(/,/g, '').replace(/\s/g, '');
  if (!trimmed) return null;
  const million = /m$/i.test(trimmed);
  const core = million ? trimmed.slice(0, -1) : trimmed;
  if (!/^\d+(\.\d+)?$/.test(core)) return null;
  const [wholePart, fracPart = ''] = core.split('.');
  if (!wholePart) return null;
  let shillings = BigInt(wholePart);
  if (fracPart.length > 0) {
    const padded = (fracPart + '00').slice(0, 2);
    const frac = BigInt(padded);
    shillings = shillings * HUNDRED + frac;
    if (million) {
      return shillings * MILLION_SHILLINGS;
    }
    return shillings;
  }
  if (million) {
    return shillings * MILLION_SHILLINGS * HUNDRED;
  }
  return shillings * HUNDRED;
}

export const sumCents = (xs: readonly Cents[]): Cents =>
  xs.reduce((a, b) => a + b, BigInt(0));
