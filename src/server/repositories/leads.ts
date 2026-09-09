import type { Actor, Decision } from '@/server/policy';
import { canViewLeadContact } from '@/server/policy';
import type { FullLead, LeadView, RedactedLead } from '@/server/dto/lead';
import type { Database } from '@/lib/types/database';
import type { MatchableLead } from '@/server/services/matching';
import { createClient } from '@/server/supabase/server';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type GrantRow = Database['public']['Tables']['lead_contact_grants']['Row'];
type PoolRow = Database['public']['Views']['lead_pool']['Row'];

export type { LeadView };

async function ownerName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', ownerId)
    .maybeSingle();
  if (error) throw error;
  return data?.full_name ?? 'Member';
}

async function areaLabel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  areaId: string | null,
  freeText: string | null,
): Promise<string | null> {
  if (areaId) {
    const { data, error } = await supabase
      .from('areas')
      .select('name')
      .eq('id', areaId)
      .maybeSingle();
    if (error) throw error;
    if (data?.name) return data.name;
  }
  return freeText;
}

async function grantsFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
): Promise<GrantRow[]> {
  const { data, error } = await supabase
    .from('lead_contact_grants')
    .select('*')
    .eq('lead_id', leadId);
  if (error) throw error;
  return data ?? [];
}

export async function insertLead(values: LeadInsert): Promise<LeadRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .insert(values)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getLeadView(
  actor: Actor,
  leadId: string,
  now = new Date(),
): Promise<LeadView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [name, label, grantRows] = await Promise.all([
    ownerName(supabase, data.owner_id),
    areaLabel(supabase, data.area_id, data.area_free_text),
    grantsFor(supabase, data.id),
  ]);
  const decision = canViewLeadContact(
    actor,
    { id: data.id, ownerId: data.owner_id },
    grantRows.map((g) => ({
      leadId: g.lead_id,
      granteeId: g.grantee_id,
      revokedAt: g.revoked_at,
      expiresAt: g.expires_at,
    })),
    now,
  );
  if (decision.allow && data.owner_id !== actor.id) {
    const { error: viewError } = await supabase.rpc('record_lead_contact_view', {
      p_lead_id: leadId,
    });
    if (viewError) throw viewError;
  }
  return toLeadView({ ...data, owner_name: name, area_label: label }, decision);
}

export async function listMyLeads(actor: Actor): Promise<LeadView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('owner_id', actor.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const views: LeadView[] = [];
  for (const row of rows) {
    const label = await areaLabel(supabase, row.area_id, row.area_free_text);
    views.push(
      toLeadView(
        { ...row, owner_name: actor.fullName, area_label: label },
        { allow: true },
      ),
    );
  }
  return views;
}

export async function listLeadPool(): Promise<RedactedLead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lead_pool')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((row) => poolToRedacted(row) ?? []);
}

function poolToRedacted(row: PoolRow): RedactedLead | null {
  if (!row.id || !row.owner_id || !row.chapter_id || !row.lead_type || !row.status || !row.created_at) {
    return null;
  }
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? 'Member',
    chapterId: row.chapter_id,
    leadType: row.lead_type,
    propertyType: row.property_type,
    areaLabel: row.area_label,
    budgetMinCents: row.budget_min === null || row.budget_min === undefined ? null : String(row.budget_min),
    budgetMaxCents: row.budget_max === null || row.budget_max === undefined ? null : String(row.budget_max),
    timeline: row.timeline,
    status: row.status,
    createdAt: row.created_at,
    contactVisible: false,
  };
}

export async function updateLead(
  leadId: string,
  patch: Database['public']['Tables']['leads']['Update'],
): Promise<LeadRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', leadId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLead(leadId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  if (error) throw error;
}

function centsString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export function toLeadView(
  row: LeadRow & { owner_name: string; area_label: string | null },
  decision: Decision,
): LeadView {
  const base: RedactedLead = {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    chapterId: row.chapter_id,
    leadType: row.lead_type,
    propertyType: row.property_type,
    areaLabel: row.area_label,
    budgetMinCents: centsString(row.budget_min),
    budgetMaxCents: centsString(row.budget_max),
    timeline: row.timeline,
    status: row.status,
    createdAt: row.created_at,
    contactVisible: false,
  };
  if (!decision.allow) return base;
  const full: FullLead = {
    ...base,
    contactVisible: true,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email,
    notes: row.notes,
    source: row.source,
  };
  return full;
}

export async function getMatchableLead(leadId: string): Promise<MatchableLead | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('id, owner_id, chapter_id, lead_type, status, area_id, area_free_text, budget_min, budget_max, property_type, timeline')
    .eq('id', leadId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  let parentId: string | null = null;
  let city: string | null = null;
  if (data.area_id) {
    const { data: area } = await supabase
      .from('areas')
      .select('parent_id, city')
      .eq('id', data.area_id)
      .maybeSingle();
    parentId = area?.parent_id ?? null;
    city = area?.city ?? null;
  }
  return {
    id: data.id,
    ownerId: data.owner_id,
    chapterId: data.chapter_id,
    leadType: data.lead_type,
    status: data.status,
    areaId: data.area_id,
    areaParentId: parentId,
    areaCity: city,
    areaFreeText: data.area_free_text,
    budgetMinCents: data.budget_min === null ? null : BigInt(data.budget_min),
    budgetMaxCents: data.budget_max === null ? null : BigInt(data.budget_max),
    propertyType: data.property_type,
    timeline: data.timeline,
  };
}
