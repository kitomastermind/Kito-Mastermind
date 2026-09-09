'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { normalizeKenyaPhone } from '@/lib/phone';
import { parseBudgetInput } from '@/server/services/money';
import { writeAudit } from '@/server/audit';
import { persistMatches, rankMatches, type MatchCardView } from '@/server/admin/insert-matches';
import { getMatchableLead, insertLead } from '@/server/repositories/leads';
import { listMatchablePool } from '@/server/repositories/pool';
import { requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import type { Database } from '@/lib/types/database';
import { recomputeGrantorsForLead } from '@/server/admin/recalculate-points';

const LeadType = z.enum(['BUYER', 'SELLER', 'RENTAL_SEEKER', 'RENTAL_LISTER']);
const PropertyType = z.enum(['APARTMENT', 'TOWNHOUSE', 'STANDALONE_HOUSE', 'LAND']).nullable();
const Timeline = z
  .enum(['IMMEDIATE', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'BROWSING'])
  .nullable();
const Source = z
  .enum(['REFERRAL', 'WEBSITE', 'WALK_IN', 'SOCIAL_MEDIA', 'MEMBER_REFERRAL'])
  .nullable();
const Crm = z.enum(['NONE', 'FOLLOW_UP_BOSS', 'HUBSPOT', 'KVCORE', 'ZOHO']);

const CreateLeadSchema = z.object({
  clientName: z.string().min(2).max(120),
  clientPhone: z.string().min(8).max(20),
  clientEmail: z.string().email().optional().or(z.literal('')),
  leadType: LeadType,
  areaId: z.string().uuid().nullable(),
  areaFreeText: z.string().max(80).nullable(),
  propertyType: PropertyType,
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  timeline: Timeline,
  source: Source,
  notes: z.string().max(4000).optional().or(z.literal('')),
  consentConfirmed: z.literal(true),
  crmSyncTarget: Crm,
});

export async function createLeadAction(
  input: unknown,
): Promise<ActionResult<{ leadId: string; matches: MatchCardView[] }>> {
  const actor = await requireActor();
  const parsed = CreateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Check the form and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const phone = normalizeKenyaPhone(parsed.data.clientPhone);
  if (!phone) {
    return {
      ok: false,
      error: 'Enter a Kenyan phone number.',
      fieldErrors: { clientPhone: ['Enter a number like 0712 345 678'] },
    };
  }
  if (!parsed.data.areaId && !parsed.data.areaFreeText) {
    return {
      ok: false,
      error: 'Choose an area or type a neighbourhood.',
      fieldErrors: { areaFreeText: ['Area is required'] },
    };
  }
  const budgetMin = parsed.data.budgetMin ? parseBudgetInput(parsed.data.budgetMin) : null;
  const budgetMax = parsed.data.budgetMax ? parseBudgetInput(parsed.data.budgetMax) : null;
  if (parsed.data.budgetMin && budgetMin === null) {
    return { ok: false, error: 'Budget minimum is not a number.', fieldErrors: { budgetMin: ['Use figures, or 28m'] } };
  }
  if (parsed.data.budgetMax && budgetMax === null) {
    return { ok: false, error: 'Budget maximum is not a number.', fieldErrors: { budgetMax: ['Use figures, or 32m'] } };
  }

  const row = await insertLead({
    owner_id: actor.id,
    chapter_id: actor.chapterId,
    client_name: parsed.data.clientName,
    client_phone: phone,
    client_email: parsed.data.clientEmail ? parsed.data.clientEmail : null,
    notes: parsed.data.notes ? parsed.data.notes : null,
    lead_type: parsed.data.leadType,
    property_type: parsed.data.propertyType,
    area_id: parsed.data.areaId,
    area_free_text: parsed.data.areaFreeText,
    budget_min: (budgetMin === null ? null : budgetMin.toString()) as unknown as number,
    budget_max: (budgetMax === null ? null : budgetMax.toString()) as unknown as number,
    timeline: parsed.data.timeline,
    source: parsed.data.source,
    consent_confirmed: true,
    crm_sync_target: parsed.data.crmSyncTarget,
  });

  await writeAudit({
    actorId: actor.id,
    action: 'LEAD_CREATED',
    subjectType: 'lead',
    subjectId: row.id,
    metadata: { lead_type: row.lead_type },
  });

  const fresh = await getMatchableLead(row.id);
  const pool = await listMatchablePool();
  const matches = fresh ? await persistMatches(fresh, rankMatches(fresh, pool)) : [];

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { ok: true, data: { leadId: row.id, matches } };
}

const UpdateSchema = z.object({
  leadId: z.string().uuid(),
  status: z
    .enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNDER_CONTRACT', 'CLOSED', 'LOST'])
    .optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function updateLeadAction(
  input: unknown,
): Promise<ActionResult<{ leadId: string }>> {
  const actor = await requireActor();
  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Check the form and try again.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { canEditLead } = await import('@/server/policy');
  const { getLeadView, updateLead } = await import('@/server/repositories/leads');
  const lead = await getLeadView(actor, parsed.data.leadId);
  if (!lead) return { ok: false, error: 'Lead not found.' };
  const decision = canEditLead(actor, {
    id: lead.id,
    ownerId: lead.ownerId,
    chapterId: lead.chapterId,
  });
  if (!decision.allow) return { ok: false, error: decision.reason };
  const patch: Database['public']['Tables']['leads']['Update'] = {};
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;
  await updateLead(parsed.data.leadId, patch);
  if (parsed.data.status && parsed.data.status !== 'NEW') {
    await recomputeGrantorsForLead(parsed.data.leadId);
  }
  revalidatePath(`/leads/${parsed.data.leadId}`);
  revalidatePath('/leads');
  return { ok: true, data: { leadId: parsed.data.leadId } };
}

export async function deleteLeadAction(
  input: unknown,
): Promise<ActionResult<{ leadId: string }>> {
  const actor = await requireActor();
  const parsed = z.object({ leadId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Lead is required.' };
  const { canDeleteLead } = await import('@/server/policy');
  const { getLeadView, deleteLead } = await import('@/server/repositories/leads');
  const lead = await getLeadView(actor, parsed.data.leadId);
  if (!lead) return { ok: false, error: 'Lead not found.' };
  const decision = canDeleteLead(actor, {
    id: lead.id,
    ownerId: lead.ownerId,
    chapterId: lead.chapterId,
  });
  if (!decision.allow) return { ok: false, error: decision.reason };
  await deleteLead(parsed.data.leadId);
  await writeAudit({
    actorId: actor.id,
    action: 'LEAD_DELETED',
    subjectType: 'lead',
    subjectId: parsed.data.leadId,
  });
  revalidatePath('/leads');
  return { ok: true, data: { leadId: parsed.data.leadId } };
}
