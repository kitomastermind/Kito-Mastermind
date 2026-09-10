'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { writeAudit } from '@/server/audit';
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  writeLoginAudit,
} from '@/server/admin/login-attempts';
import { sendInviteEmail } from '@/server/email/invite';
import { canInviteMember } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Email or password is not correct.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const email = parsed.data.email.trim().toLowerCase();
  const gate = await checkLoginRateLimit(email);
  if (!gate.ok) {
    await writeLoginAudit('LOGIN_LOCKED', email);
    return {
      ok: false,
      error: `Too many attempts. Try again in ${gate.retryAfterMinutes} minutes.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (error) {
    await recordLoginAttempt(email, false);
    await writeLoginAudit('LOGIN_FAILED', email);
    return { ok: false, error: 'Email or password is not correct.' };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    await recordLoginAttempt(email, false);
    return { ok: false, error: 'Email or password is not correct.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, active')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    await recordLoginAttempt(email, false);
    return {
      ok: false,
      error: 'Your account is not set up yet. Contact your chapter lead.',
    };
  }
  if (!profile.active) {
    await supabase.auth.signOut();
    await recordLoginAttempt(email, false);
    return {
      ok: false,
      error: 'This account is not active. Contact your chapter lead.',
    };
  }

  await recordLoginAttempt(email, true);
  if (parsed.data.remember) {
    await supabase.auth.updateUser({ data: { remember: true } });
  }
  return { ok: true, data: { redirectTo: '/dashboard' } };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

const ForgotSchema = z.object({ email: z.string().email() });

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = ForgotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid email address.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email.trim().toLowerCase(), {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) {
    logger.warn('reset-email-failed', { message: error.message });
  }
  return { ok: true, data: undefined };
}

const ResetSchema = z
  .object({
    password: z.string().min(12, 'Use at least 12 characters.'),
    confirm: z.string().min(12),
  })
  .refine((value) => value.password === value.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  });

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = ResetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Check the password fields and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, data: undefined };
}

const InviteSchema = z.object({
  email: z.string().email(),
  chapterId: z.string().uuid(),
  role: z.enum(['MEMBER', 'TREASURER', 'CHAPTER_LEAD', 'ADMIN']),
});

export async function createInvitationAction(
  input: unknown,
): Promise<ActionResult<{ inviteUrl?: string }>> {
  const actor = await requireActor();
  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Check the invitation fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const decision = canInviteMember(actor, parsed.data.chapterId, parsed.data.role);
  if (!decision.allow) {
    return { ok: false, error: decision.reason };
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { insertInvitation } = await import('@/server/admin/invitations');
  let data: { id: string };
  try {
    data = await insertInvitation({
      email: parsed.data.email.trim().toLowerCase(),
      chapterId: parsed.data.chapterId,
      role: parsed.data.role,
      tokenHash,
      invitedBy: actor.id,
      expiresAt: expires,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create the invitation.';
    return { ok: false, error: message };
  }

  await writeAudit({
    actorId: actor.id,
    action: 'MEMBER_INVITED',
    subjectType: 'invitation',
    subjectId: data.id,
    metadata: { role: parsed.data.role, chapterId: parsed.data.chapterId },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${origin}/invite/${token}`;
  await sendInviteEmail(parsed.data.email.trim().toLowerCase(), inviteUrl);
  revalidatePath('/admin/members');
  return {
    ok: true,
    data: process.env.NODE_ENV === 'production' ? {} : { inviteUrl },
  };
}
