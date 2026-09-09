import { supabaseAdmin } from '@/server/admin/client';
import { persistMatches, rankMatches } from '@/server/admin/insert-matches';
import type { MatchableLead } from '@/server/services/matching';

type MatchableRow = {
  id: string;
  owner_id: string;
  chapter_id: string;
  lead_type: MatchableLead['leadType'];
  status: MatchableLead['status'];
  area_id: string | null;
  area_free_text: string | null;
  budget_min: number | null;
  budget_max: number | null;
  property_type: MatchableLead['propertyType'];
  timeline: MatchableLead['timeline'];
};

function toMatchable(
  row: MatchableRow,
  areas: Map<string, { parent_id: string | null; city: string | null }>,
): MatchableLead {
  const area = row.area_id ? areas.get(row.area_id) : undefined;
  return {
    id: row.id,
    ownerId: row.owner_id,
    chapterId: row.chapter_id,
    leadType: row.lead_type,
    status: row.status,
    areaId: row.area_id,
    areaParentId: area?.parent_id ?? null,
    areaCity: area?.city ?? null,
    areaFreeText: row.area_free_text,
    budgetMinCents: row.budget_min === null ? null : BigInt(row.budget_min),
    budgetMaxCents: row.budget_max === null ? null : BigInt(row.budget_max),
    propertyType: row.property_type,
    timeline: row.timeline,
  };
}

export async function rescanMatches(): Promise<{ scanned: number }> {
  const { data, error } = await supabaseAdmin.rpc('matchable_leads');
  if (error) throw error;
  const { data: areaRows } = await supabaseAdmin.from('areas').select('id, parent_id, city');
  const areas = new Map(
    (areaRows ?? []).map((row) => [row.id, { parent_id: row.parent_id, city: row.city }] as const),
  );
  const pool = ((data ?? []) as MatchableRow[]).map((row) => toMatchable(row, areas));
  for (const lead of pool) {
    await persistMatches(lead, rankMatches(lead, pool));
  }
  return { scanned: pool.length };
}
