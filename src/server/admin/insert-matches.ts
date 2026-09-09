import { canonicalPair, scoreMatch, type MatchFacet, type MatchableLead } from '@/server/services/matching';
import { supabaseAdmin } from '@/server/admin/client';
import { deliverNotification } from '@/server/admin/notify';
import { notificationCopy } from '@/server/services/notification-copy';
import type { Json } from '@/lib/types/database';
import { firstName } from '@/lib/format';

export type MatchCardView = {
  id: string;
  otherLeadId: string;
  otherOwnerId: string;
  ownerName: string;
  ownerFirstName: string;
  loggedAt: string;
  chapterName: string;
  score: number;
  facets: { label: string; kind: 'exact' | 'partial' }[];
  requestState: 'pending' | 'requested' | 'granted' | 'declined';
};

const MATCH_STATUS_MAP = {
  PENDING: 'pending',
  ACCESS_REQUESTED: 'requested',
  ACCESS_GRANTED: 'granted',
  DECLINED: 'declined',
  CLOSED: 'pending',
} as const;

export function rankMatches(
  fresh: MatchableLead,
  pool: MatchableLead[],
): Array<{ other: MatchableLead; score: number; facets: MatchFacet[] }> {
  const ranked: Array<{ other: MatchableLead; score: number; facets: MatchFacet[] }> = [];
  for (const candidate of pool) {
    const result = scoreMatch(fresh, candidate);
    if (!result || result.score < 55) continue;
    ranked.push({ other: candidate, score: result.score, facets: result.facets });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, 10);
}

export async function persistMatches(
  fresh: MatchableLead,
  ranked: Array<{ other: MatchableLead; score: number; facets: MatchFacet[] }>,
): Promise<MatchCardView[]> {
  const cards: MatchCardView[] = [];
  for (const item of ranked) {
    const pair = canonicalPair(fresh.id, item.other.id);
    const { data: existing } = await supabaseAdmin
      .from('lead_matches')
      .select('id, status, created_at')
      .eq('lead_a_id', pair.leadAId)
      .eq('lead_b_id', pair.leadBId)
      .maybeSingle();

    let matchId = existing?.id;
    if (!matchId) {
      const { data: inserted, error } = await supabaseAdmin
        .from('lead_matches')
        .insert({
          lead_a_id: pair.leadAId,
          lead_b_id: pair.leadBId,
          score: item.score,
          matched_facets: item.facets as unknown as Json,
          status: 'PENDING',
        })
        .select('id, created_at')
        .single();
      if (error) throw error;
      matchId = inserted.id;
      await notifyMatch(fresh, item.other);
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, chapters(name)')
      .eq('id', item.other.ownerId)
      .maybeSingle();
    const chapterName =
      profile?.chapters && typeof profile.chapters === 'object' && 'name' in profile.chapters
        ? String(profile.chapters.name)
        : 'Chapter';
    const ownerName = profile?.full_name ?? 'Member';
    const status = existing?.status ?? 'PENDING';
    cards.push({
      id: matchId,
      otherLeadId: item.other.id,
      otherOwnerId: item.other.ownerId,
      ownerName,
      ownerFirstName: firstName(ownerName),
      loggedAt: existing?.created_at ?? new Date().toISOString(),
      chapterName,
      score: item.score,
      facets: item.facets.map((facet) => ({ label: facet.label, kind: facet.kind })),
      requestState: MATCH_STATUS_MAP[status],
    });
  }
  cards.sort((a, b) => b.score - a.score);
  return cards;
}

async function notifyMatch(a: MatchableLead, b: MatchableLead): Promise<void> {
  const { data: names } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', [a.ownerId, b.ownerId]);
  const nameOf = (id: string): string =>
    names?.find((row) => row.id === id)?.full_name ?? 'A member';
  const areaOf = (lead: MatchableLead): string => lead.areaFreeText ?? 'your chapter';
  await deliverNotification({
    profileId: a.ownerId,
    type: 'LEAD_MATCH',
    copy: notificationCopy('LEAD_MATCH', {
      otherName: nameOf(b.ownerId),
      areaLabel: areaOf(b),
    }),
  });
  await deliverNotification({
    profileId: b.ownerId,
    type: 'LEAD_MATCH',
    copy: notificationCopy('LEAD_MATCH', {
      otherName: nameOf(a.ownerId),
      areaLabel: areaOf(a),
    }),
  });
}
