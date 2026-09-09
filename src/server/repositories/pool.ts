import type { MatchableLead } from '@/server/services/matching';
import { createClient } from '@/server/supabase/server';

export async function listMatchablePool(): Promise<MatchableLead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('lead_pool').select('*');
  if (error) throw error;
  const { data: areas, error: areaError } = await supabase
    .from('areas')
    .select('id, parent_id, city');
  if (areaError) throw areaError;
  const areaMap = new Map(
    (areas ?? []).map((area) => [area.id, area] as const),
  );
  const out: MatchableLead[] = [];
  for (const row of data ?? []) {
    if (!row.id || !row.owner_id || !row.chapter_id || !row.lead_type || !row.status) {
      continue;
    }
    const area = row.area_id ? areaMap.get(row.area_id) : undefined;
    out.push({
      id: row.id,
      ownerId: row.owner_id,
      chapterId: row.chapter_id,
      leadType: row.lead_type,
      status: row.status,
      areaId: row.area_id,
      areaParentId: area?.parent_id ?? null,
      areaCity: area?.city ?? null,
      areaFreeText: row.area_label,
      budgetMinCents: row.budget_min === null || row.budget_min === undefined ? null : BigInt(row.budget_min),
      budgetMaxCents: row.budget_max === null || row.budget_max === undefined ? null : BigInt(row.budget_max),
      propertyType: row.property_type,
      timeline: row.timeline,
    });
  }
  return out;
}
