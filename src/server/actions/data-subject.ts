'use server';

import { z } from 'zod';
import { canViewAuditLog } from '@/server/policy';
import { requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { eraseMemberContact, exportMemberRecord } from '@/server/admin/data-subject';

export async function exportMemberAction(
  input: unknown,
): Promise<ActionResult<{ payload: Record<string, unknown> }>> {
  const actor = await requireActor();
  if (!canViewAuditLog(actor).allow) return { ok: false, error: 'You cannot export member records.' };
  const parsed = z.object({ profileId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Member is required.' };
  const payload = await exportMemberRecord(parsed.data.profileId);
  return { ok: true, data: { payload } };
}

export async function eraseMemberAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  if (actor.role !== 'ADMIN') return { ok: false, error: 'Only an admin can erase a member record.' };
  const parsed = z.object({ profileId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Member is required.' };
  await eraseMemberContact(parsed.data.profileId);
  return { ok: true, data: undefined };
}
