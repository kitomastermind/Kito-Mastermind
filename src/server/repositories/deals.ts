import { formatCompactKES } from '@/server/services/money';
import type { Actor } from '@/server/policy';
import { createClient } from '@/server/supabase/server';

export type DealParticipantView = {
  profileId: string;
  name: string;
  role: string;
  creditShare: number;
  confirmedAt: string | null;
};

export type DealView = {
  id: string;
  leadId: string | null;
  saleVolumeLabel: string;
  closedAt: string;
  verifiedAt: string | null;
  createdBy: string;
  participants: DealParticipantView[];
};

export async function listChapterMemberOptions(actor: Actor): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('chapter_id', actor.chapterId)
    .eq('active', true)
    .order('full_name');
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.full_name }));
}

export async function listDealsForActor(actor: Actor): Promise<DealView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('closed_business')
    .select('id, lead_id, sale_volume, closed_at, verified_at, created_by')
    .eq('chapter_id', actor.chapterId)
    .order('closed_at', { ascending: false });
  if (error) throw error;
  return hydrateDeals(data ?? []);
}

export async function listDealsForLead(leadId: string): Promise<DealView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('closed_business')
    .select('id, lead_id, sale_volume, closed_at, verified_at, created_by')
    .eq('lead_id', leadId)
    .order('closed_at', { ascending: false });
  if (error) throw error;
  return hydrateDeals(data ?? []);
}

async function hydrateDeals(
  rows: {
    id: string;
    lead_id: string | null;
    sale_volume: number;
    closed_at: string;
    verified_at: string | null;
    created_by: string;
  }[],
): Promise<DealView[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const ids = rows.map((row) => row.id);
  const { data: parts, error } = await supabase
    .from('closed_business_participants')
    .select('closed_business_id, profile_id, participant_role, credit_share, confirmed_at');
  if (error) throw error;
  const mine = (parts ?? []).filter((row) => ids.includes(row.closed_business_id));
  const profileIds = [...new Set(mine.map((row) => row.profile_id))];
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
    : { data: [] as { id: string; full_name: string }[] };
  return rows.map((row) => ({
    id: row.id,
    leadId: row.lead_id,
    saleVolumeLabel: formatCompactKES(BigInt(String(row.sale_volume))),
    closedAt: row.closed_at,
    verifiedAt: row.verified_at,
    createdBy: row.created_by,
    participants: mine
      .filter((part) => part.closed_business_id === row.id)
      .map((part) => ({
        profileId: part.profile_id,
        name: profiles?.find((item) => item.id === part.profile_id)?.full_name ?? 'Member',
        role: part.participant_role,
        creditShare: part.credit_share,
        confirmedAt: part.confirmed_at,
      })),
  }));
}
