'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { sendNotificationEmail } from '@/server/email/notification';
import { notificationCopy } from '@/server/services/notification-copy';
import {
  canRequestContactAccess,
  canRespondToRequest,
  canRevokeGrant,
} from '@/server/policy';
import { listLeadPool } from '@/server/repositories/leads';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';

export async function requestContactAccessAction(
  input: unknown,
): Promise<ActionResult<{ requestId: string }>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      leadId: z.string().uuid(),
      matchId: z.string().uuid().nullable(),
      message: z.string().max(500).optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Check the request and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const pool = await listLeadPool();
  const lead = pool.find((row) => row.id === parsed.data.leadId);
  if (!lead) return { ok: false, error: 'Lead not found.' };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from('contact_access_requests')
    .select('lead_id, requester_id, owner_id, status')
    .eq('lead_id', lead.id)
    .eq('requester_id', actor.id);
  if (existingError) throw existingError;

  const decision = canRequestContactAccess(
    actor,
    { id: lead.id, ownerId: lead.ownerId, chapterId: lead.chapterId },
    (existing ?? []).map((row) => ({
      leadId: row.lead_id,
      requesterId: row.requester_id,
      ownerId: row.owner_id,
      status: row.status,
    })),
  );
  if (!decision.allow) return { ok: false, error: decision.reason };

  const { data: requestId, error } = await supabase.rpc('request_contact_access', {
    p_lead_id: parsed.data.leadId,
    p_match_id: parsed.data.matchId as string,
    p_message: (parsed.data.message ?? null) as string,
  });
  if (error) throw error;

  const { data: owner } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', lead.ownerId)
    .maybeSingle();
  if (owner?.email) {
    const copy = notificationCopy('ACCESS_REQUESTED', {
      otherName: actor.fullName,
      areaLabel: lead.areaLabel ?? 'your chapter',
      leadType: lead.leadType,
      leadId: lead.id,
    });
    await sendNotificationEmail(owner.email, copy.title, copy.body);
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${lead.id}`);
  return { ok: true, data: { requestId } };
}

export async function approveAccessAction(
  input: unknown,
): Promise<ActionResult<{ grantId: string }>> {
  const actor = await requireActor();
  const parsed = z.object({ requestId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Request is required.' };
  const supabase = await createClient();
  const { data: request, error: loadError } = await supabase
    .from('contact_access_requests')
    .select('*')
    .eq('id', parsed.data.requestId)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!request) return { ok: false, error: 'Request not found.' };
  const decision = canRespondToRequest(actor, {
    ownerId: request.owner_id,
    status: request.status,
  });
  if (!decision.allow) return { ok: false, error: decision.reason };
  const { data: grantId, error } = await supabase.rpc('approve_access_request', {
    p_request_id: parsed.data.requestId,
  });
  if (error) throw error;
  const { data: requester } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', request.requester_id)
    .maybeSingle();
  if (requester?.email) {
    const copy = notificationCopy('ACCESS_GRANTED', {
      otherName: actor.fullName,
      leadId: request.lead_id,
    });
    await sendNotificationEmail(requester.email, copy.title, copy.body);
  }
  revalidatePath(`/leads/${request.lead_id}`);
  return { ok: true, data: { grantId } };
}

export async function declineAccessAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({ requestId: z.string().uuid(), reason: z.string().max(500).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Request is required.' };
  const supabase = await createClient();
  const { data: request, error: loadError } = await supabase
    .from('contact_access_requests')
    .select('*')
    .eq('id', parsed.data.requestId)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!request) return { ok: false, error: 'Request not found.' };
  const decision = canRespondToRequest(actor, {
    ownerId: request.owner_id,
    status: request.status,
  });
  if (!decision.allow) return { ok: false, error: decision.reason };
  const { error } = await supabase.rpc('decline_access_request', {
    p_request_id: parsed.data.requestId,
    p_reason: (parsed.data.reason ?? null) as string,
  });
  if (error) throw error;
  const { data: requester } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', request.requester_id)
    .maybeSingle();
  if (requester?.email) {
    const copy = notificationCopy('ACCESS_DENIED', { otherName: actor.fullName });
    await sendNotificationEmail(requester.email, copy.title, copy.body);
  }
  revalidatePath(`/leads/${request.lead_id}`);
  return { ok: true, data: undefined };
}

export async function revokeGrantAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({ grantId: z.string().uuid(), reason: z.string().max(300).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Grant is required.' };
  const supabase = await createClient();
  const { data: grant, error: loadError } = await supabase
    .from('lead_contact_grants')
    .select('*')
    .eq('id', parsed.data.grantId)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!grant) return { ok: false, error: 'Grant not found.' };
  const decision = canRevokeGrant(actor, {
    grantorId: grant.grantor_id,
    revokedAt: grant.revoked_at,
  });
  if (!decision.allow) return { ok: false, error: decision.reason };
  const { error } = await supabase.rpc('revoke_lead_grant', {
    p_grant_id: parsed.data.grantId,
    p_reason: (parsed.data.reason ?? null) as string,
  });
  if (error) throw error;
  const { data: grantee } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', grant.grantee_id)
    .maybeSingle();
  if (grantee?.email) {
    const copy = notificationCopy('ACCESS_REVOKED', { otherName: actor.fullName });
    await sendNotificationEmail(grantee.email, copy.title, copy.body);
  }
  revalidatePath(`/leads/${grant.lead_id}`);
  return { ok: true, data: undefined };
}
