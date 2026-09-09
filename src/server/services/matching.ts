import type { Database } from '@/lib/types/database';

export type LeadType = Database['public']['Enums']['lead_type'];
export type PropertyType = Database['public']['Enums']['property_type'];
export type LeadStatus = Database['public']['Enums']['lead_status'];
export type LeadTimeline = Database['public']['Enums']['lead_timeline'];

export type MatchableLead = {
  id: string;
  ownerId: string;
  chapterId: string;
  leadType: LeadType;
  status: LeadStatus;
  areaId: string | null;
  areaParentId: string | null;
  areaCity: string | null;
  areaFreeText: string | null;
  budgetMinCents: bigint | null;
  budgetMaxCents: bigint | null;
  propertyType: PropertyType | null;
  timeline: LeadTimeline | null;
};

export type FacetKind = 'exact' | 'partial';

export type MatchFacet = {
  facet: 'AREA' | 'BUDGET' | 'PROPERTY' | 'TIMELINE';
  score: number;
  label: string;
  kind: FacetKind;
};

export type MatchScore = {
  score: number;
  facets: MatchFacet[];
};

const COMPLEMENTS: Record<LeadType, LeadType> = {
  BUYER: 'SELLER',
  SELLER: 'BUYER',
  RENTAL_SEEKER: 'RENTAL_LISTER',
  RENTAL_LISTER: 'RENTAL_SEEKER',
};

const TIMELINE_ORDER: LeadTimeline[] = [
  'IMMEDIATE',
  'ONE_TO_THREE_MONTHS',
  'THREE_TO_SIX_MONTHS',
  'BROWSING',
];

export function isMatchable(a: MatchableLead, b: MatchableLead): boolean {
  if (a.id === b.id) return false;
  if (a.ownerId === b.ownerId) return false;
  if (a.chapterId !== b.chapterId) return false;
  if (COMPLEMENTS[a.leadType] !== b.leadType) return false;
  if (a.status === 'CLOSED' || a.status === 'LOST') return false;
  if (b.status === 'CLOSED' || b.status === 'LOST') return false;
  return true;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function trigrams(value: string): Set<string> {
  const padded = `  ${value.toLowerCase().replace(/\s+/g, ' ').trim()} `;
  const set = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i += 1) {
    set.add(padded.slice(i, i + 3));
  }
  return set;
}

export function trigramSimilarity(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (left.size === 0 && right.size === 0) return 1;
  let inter = 0;
  for (const token of left) {
    if (right.has(token)) inter += 1;
  }
  const union = left.size + right.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function scoreArea(a: MatchableLead, b: MatchableLead): number {
  if (a.areaId && b.areaId && a.areaId === b.areaId) return 1;
  if (
    a.areaId &&
    b.areaId &&
    a.areaParentId &&
    b.areaParentId &&
    a.areaParentId === b.areaParentId
  ) {
    return 0.6;
  }
  if (a.areaId && b.areaId && a.areaCity && b.areaCity && a.areaCity === b.areaCity) {
    return 0.25;
  }
  if (!a.areaId && !b.areaId && a.areaFreeText && b.areaFreeText) {
    return Math.min(0.8, trigramSimilarity(a.areaFreeText, b.areaFreeText));
  }
  return 0;
}

function rangeWidth(min: bigint, max: bigint): bigint {
  const width = max - min;
  return width > BigInt(0) ? width : BigInt(1);
}

export function scoreBudget(a: MatchableLead, b: MatchableLead): number {
  const aMissing = a.budgetMinCents === null && a.budgetMaxCents === null;
  const bMissing = b.budgetMinCents === null && b.budgetMaxCents === null;
  if (aMissing || bMissing) return 0.4;
  const aMin = a.budgetMinCents ?? a.budgetMaxCents ?? BigInt(0);
  const aMax = a.budgetMaxCents ?? a.budgetMinCents ?? BigInt(0);
  const bMin = b.budgetMinCents ?? b.budgetMaxCents ?? BigInt(0);
  const bMax = b.budgetMaxCents ?? b.budgetMinCents ?? BigInt(0);
  const aPoint = aMin === aMax;
  const bPoint = bMin === bMax;
  if (aPoint || bPoint) {
    const point = aPoint ? aMin : bMin;
    const rMin = aPoint ? bMin : aMin;
    const rMax = aPoint ? bMax : aMax;
    if (point >= rMin && point <= rMax) return 1;
    const width = rangeWidth(rMin, rMax);
    const outside =
      point < rMin ? rMin - point : point - rMax;
    const span = (width * BigInt(25)) / BigInt(100);
    if (span === BigInt(0)) return 0;
    return clamp01(1 - Number(outside) / Number(span));
  }
  const denom = minBig(rangeWidth(aMin, aMax), rangeWidth(bMin, bMax));
  const overlap = minBig(aMax, bMax) - maxBig(aMin, bMin);
  if (overlap > BigInt(0)) {
    return clamp01(Number(overlap) / Number(denom));
  }
  const pad = (denom * BigInt(25)) / BigInt(100);
  const paddedOverlap =
    minBig(aMax + pad, bMax + pad) - maxBig(aMin - pad, bMin - pad);
  if (paddedOverlap <= BigInt(0)) return 0;
  return clamp01(Number(paddedOverlap) / Number(denom));
}

function minBig(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function maxBig(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

export function scoreProperty(a: MatchableLead, b: MatchableLead): number {
  if (!a.propertyType || !b.propertyType) return 0.5;
  if (a.propertyType === b.propertyType) return 1;
  if (a.propertyType === 'LAND' || b.propertyType === 'LAND') return 0;
  const pair = new Set([a.propertyType, b.propertyType]);
  if (pair.has('APARTMENT') && pair.has('TOWNHOUSE')) return 0.4;
  return 0;
}

export function scoreTimeline(a: MatchableLead, b: MatchableLead): number {
  if (!a.timeline || !b.timeline) return 0.5;
  if (a.timeline === b.timeline) return 1;
  const ia = TIMELINE_ORDER.indexOf(a.timeline);
  const ib = TIMELINE_ORDER.indexOf(b.timeline);
  const diff = Math.abs(ia - ib);
  if (
    (a.timeline === 'BROWSING' && b.timeline === 'IMMEDIATE') ||
    (a.timeline === 'IMMEDIATE' && b.timeline === 'BROWSING')
  ) {
    return 0;
  }
  if (diff === 1) return 0.5;
  if (diff === 2) return 0.2;
  return 0;
}

function facetKind(score: number): FacetKind | null {
  if (score >= 0.85) return 'exact';
  if (score >= 0.3) return 'partial';
  return null;
}

function millionLabel(min: bigint | null, max: bigint | null): string {
  if (min === null && max === null) return 'Budget unset';
  const toM = (c: bigint): string => {
    const shillings = c / BigInt(100);
    const millions = shillings / BigInt(1_000_000);
    const tenth = (shillings % BigInt(1_000_000)) / BigInt(100_000);
    return tenth === BigInt(0) ? `${millions}M` : `${millions}.${tenth}M`;
  };
  if (min !== null && max !== null && min !== max) {
    return `${toM(min)}-${toM(max)}`;
  }
  return toM(min ?? max ?? BigInt(0));
}

function timelineLabel(value: LeadTimeline): string {
  switch (value) {
    case 'IMMEDIATE':
      return 'Immediate';
    case 'ONE_TO_THREE_MONTHS':
      return '1-3 mo';
    case 'THREE_TO_SIX_MONTHS':
      return '3-6 mo';
    case 'BROWSING':
      return 'Browsing';
    default:
      return value;
  }
}

function propertyLabel(value: PropertyType): string {
  switch (value) {
    case 'STANDALONE_HOUSE':
      return 'Standalone house';
    case 'TOWNHOUSE':
      return 'Townhouse';
    case 'APARTMENT':
      return 'Apartment';
    case 'LAND':
      return 'Land';
    default:
      return value;
  }
}

export function scoreMatch(a: MatchableLead, b: MatchableLead): MatchScore | null {
  if (!isMatchable(a, b)) return null;
  const area = scoreArea(a, b);
  const budget = scoreBudget(a, b);
  const property = scoreProperty(a, b);
  const timeline = scoreTimeline(a, b);
  const score = Math.round(40 * area + 30 * budget + 20 * property + 10 * timeline);
  const raw: Array<{ facet: MatchFacet['facet']; score: number; label: string }> = [
    {
      facet: 'AREA',
      score: area,
      label: a.areaFreeText ?? b.areaFreeText ?? 'Area',
    },
    {
      facet: 'BUDGET',
      score: budget,
      label: millionLabel(
        a.budgetMinCents ?? b.budgetMinCents,
        a.budgetMaxCents ?? b.budgetMaxCents,
      ),
    },
    {
      facet: 'PROPERTY',
      score: property,
      label:
        a.propertyType && b.propertyType && a.propertyType !== b.propertyType
          ? `${propertyLabel(a.propertyType)} vs ${propertyLabel(b.propertyType)}`
          : propertyLabel(a.propertyType ?? b.propertyType ?? 'APARTMENT'),
    },
    {
      facet: 'TIMELINE',
      score: timeline,
      label:
        a.timeline && b.timeline && a.timeline !== b.timeline
          ? `${timelineLabel(a.timeline)} vs ${timelineLabel(b.timeline)}`
          : timelineLabel(a.timeline ?? b.timeline ?? 'IMMEDIATE'),
    },
  ];
  const facets: MatchFacet[] = [];
  for (const item of raw) {
    const kind = facetKind(item.score);
    if (!kind) continue;
    facets.push({ ...item, kind });
  }
  return { score, facets };
}

export function canonicalPair(
  aId: string,
  bId: string,
): { leadAId: string; leadBId: string } {
  return aId < bId ? { leadAId: aId, leadBId: bId } : { leadAId: bId, leadBId: aId };
}
