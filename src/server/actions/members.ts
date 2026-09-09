'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { canChangeRole, canDeactivateMember, canInviteMember } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import { writeAudit } from '@/server/audit';
import { changeMemberRole, deactivateMember, resendInvitation } from '@/server/admin/members';

export async function changeRoleAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      profileId: z.string().uuid(),
      role: z.enum(['MEMBER', 'TREASURER', 'CHAPTER_LEAD', 'ADMIN']),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Member and role are required.' };
  const supabase = await createClient();
  const { data: target } = await supabase
    .from('profiles')
    .select('id, chapter_id, role')
    .eq('id', parsed.data.profileId)
    .maybeSingle();
  if (!target) return { ok: false, error: 'Member not found.' };
  const decision = canChangeRole(
    actor,
    { id: target.id, chapterId: target.chapter_id, role: target.role },
    parsed.data.role,
  );
  if (!decision.allow) return { ok: false, error: decision.reason };
  await changeMemberRole(target.id, parsed.data.role);
  await writeAudit({
    actorId: actor.id,
    action: 'ROLE_CHANGED',
    subjectType: 'profile',
    subjectId: target.id,
    metadata: { from: target.role, to: parsed.data.role },
  });
  revalidatePath('/admin/members');
  return { ok: true, data: undefined };
}

export async function deactivateMemberAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ profileId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Member is required.' };
  const supabase = await createClient();
  const { data: target } = await supabase
    .from('profiles')
    .select('id, chapter_id')
    .eq('id', parsed.data.profileId)
    .maybeSingle();
  if (!target) return { ok: false, error: 'Member not found.' };
  const decision = canDeactivateMember(actor, { id: target.id, chapterId: target.chapter_id });
  if (!decision.allow) return { ok: false, error: decision.reason };
  await deactivateMember(target.id);
  await writeAudit({
    actorId: actor.id,
    action: 'MEMBER_DEACTIVATED',
    subjectType: 'profile',
    subjectId: target.id,
  });
  revalidatePath('/admin/members');
  return { ok: true, data: undefined };
}

export async function resendInvitationAction(input: unknown): Promise<ActionResult<{ inviteUrl?: string }>> {
  const actor = await requireActor();
  const parsed = z.object({ invitationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invitation is required.' };
  const supabase = await createClient();
  const { data: invite } = await supabase
    .from('invitations')
    .select('id, chapter_id, role, accepted_at')
    .eq('id', parsed.data.invitationId)
    .maybeSingle();
  if (!invite || invite.accepted_at) return { ok: false, error: 'Invitation not found.' };
  const decision = canInviteMember(actor, invite.chapter_id, invite.role);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const result = await resendInvitation(invite.id);
  revalidatePath('/admin/members');
  return { ok: true, data: result };
}
