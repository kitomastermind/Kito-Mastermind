'use server';

import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  completeInvitationProfile,
  findInvitationByHash,
} from '@/server/admin/invitations';
import { createClient } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';

const AcceptSchema = z
  .object({
    token: z.string().min(16),
    fullName: z.string().min(2).max(80),
    password: z.string().min(12, 'Use at least 12 characters.'),
    confirm: z.string().min(12),
    phone: z.string().min(8).max(20),
    brokerage: z.string().min(2).max(80),
    accepted: z.literal(true),
  })
  .refine((value) => value.password === value.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  });

export type InvitationView =
  | { state: 'unknown' }
  | { state: 'expired' }
  | { state: 'revoked' }
  | { state: 'accepted' }
  | {
      state: 'valid';
      email: string;
      role: string;
      chapterName: string;
    };

export async function loadInvitation(token: string): Promise<InvitationView> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const row = await findInvitationByHash(tokenHash);
  if (!row) return { state: 'unknown' };
  if (row.revoked_at) return { state: 'revoked' };
  if (row.accepted_at) return { state: 'accepted' };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { state: 'expired' };
  return {
    state: 'valid',
    email: row.email,
    role: row.role,
    chapterName: row.chapters?.name ?? 'Chapter',
  };
}

export async function acceptInvitationAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = AcceptSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Check the form and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const view = await loadInvitation(parsed.data.token);
  if (view.state !== 'valid') {
    return { ok: false, error: 'This invitation is no longer valid.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: view.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    try {
      await completeInvitationProfile({
        profileId: auth.user.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        brokerage: parsed.data.brokerage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not finish setup.';
      return { ok: false, error: message };
    }
  }

  return { ok: true, data: { redirectTo: '/dashboard' } };
}
